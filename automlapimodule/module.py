import os

from azureml.exceptions import WorkspaceException
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.wrappers import Response
from collections import namedtuple
from io import StringIO
import sys
import os
import urllib
from zipfile import ZipFile

# automl
from azureml.core.workspace import Workspace
from azureml.core.compute import AmlCompute, ComputeTarget
from azureml.automl.core.shared.constants import ImageTask
from azureml.core import Experiment, Run
from jsonl_converter import convert_mask_in_VOC_to_jsonl
#from azureml.contrib.dataset.labeled_dataset import _LabeledDatasetFactory, LabeledDatasetTask
from azureml.core import Dataset
from azureml.train.automl import AutoMLImageConfig
from azureml.train.hyperdrive import GridParameterSampling, choice, uniform, RandomParameterSampling, \
    BayesianParameterSampling
from azureml.train.hyperdrive import BanditPolicy, HyperDriveConfig, PrimaryMetricGoal

app = Flask(__name__, static_url_path='')
CORS(app)


class JSONResponse(Response):
    @classmethod
    def force_type(cls, rv, environ=None):
        if isinstance(rv, dict):
            rv = jsonify(rv)
        return super(JSONResponse, cls).force_type(rv, environ)


app.response_class = JSONResponse
WorkspaceSetupParameter = namedtuple(
    "Parameter", ["WorkspaceName", "SubscriptionId", "ResourceGroup"]
)
ComputeTargetSetupParameter = namedtuple(
    "Parameter", ["ClusterName"]
)
ExperimentSetupParameter = namedtuple(
    "Parameter", ["ExperimentName"]
)
DownloadDatasetsParameter = namedtuple(
    "Parameter", ["URL"]
)
ConvertJSONLParameter = namedtuple(
    "Parameter", ["URL"]
)
UploadJSONLImagesToDatastoreParameter = namedtuple(
    "Parameter", ["UploadFlag", "LocalTargetURL", "CloudTargetPath", "TrainingDatasetName", "ValidationDatasetName"]
)
SubmitAutoMLTaskParameter = namedtuple(
    "Parameter", ["HyperparameterSweeping", "TaskType", "ModelChoice",
                  "LearningRateMin", "LearningRateMax", "Iterations",
                  "MaxConcurrentIterations",
                  "NumberOfEpochs", "TrainingBatchSize", "SplitRatio", "ODISValidationMetricType", "Yolov5ImgSize"]
)
ExecResult = namedtuple(
    "Result", ["ExecFlag", "Msg"]
)
ExecResultGetSubmitStatus = namedtuple(
    "Result", ["ExecFlag", "Msg", "StatusUrl"]
)


class AzAutoMLModule:
    def __init__(self):
        self.ws: Workspace = None
        self.compute_target = None
        self.experiment = None
        self.training_dataset = None
        self.validation_dataset = None
        self.automl_task_run: Run = None

    def exec_WorkspaceSetup(self, Parameters: WorkspaceSetupParameter) -> ExecResult:
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        try:
            self.ws = Workspace.create(name=Parameters.WorkspaceName,
                                       subscription_id=Parameters.SubscriptionId,
                                       resource_group=Parameters.ResourceGroup,
                                       exist_ok=True)
            execResult = True
        except WorkspaceException as we:
            print(we.message)
        except Exception as e:
            print(e)
        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_ComputeTargetSetup(self, Parameters: ComputeTargetSetupParameter) -> ExecResult:
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        try:
            self.compute_target = self.ws.compute_targets[Parameters.ClusterName]
            print('Found existing compute target.')
            execResult = True
            self.compute_target.wait_for_completion(show_output=True, min_node_count=None, timeout_in_minutes=20)
        except KeyError:
            print('Creating a new compute target...')
            compute_config = AmlCompute.provisioning_configuration(vm_size='Standard_NC6',
                                                                   idle_seconds_before_scaledown=1800,
                                                                   min_nodes=0,
                                                                   max_nodes=4)
            self.compute_target = ComputeTarget.create(self.ws, Parameters.ClusterName, compute_config)
            execResult = True
            self.compute_target.wait_for_completion(show_output=True, min_node_count=None, timeout_in_minutes=20)
        except Exception as ex:
            print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_ExperimentSetup(self, Parameters: ExperimentSetupParameter) -> ExecResult:
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        try:
            self.experiment = Experiment(self.ws, name=Parameters.ExperimentName)
            execResult = True
        except Exception as ex:
            print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_DownloadDataSets(self, Parameters: DownloadDatasetsParameter) -> ExecResult:
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()

        try:
            splitURL = str(Parameters.URL).split('/')
            data_file = './datasets/' + splitURL[-1]
            print('start Download...')
            print('URL: ' + Parameters.URL)
            urllib.request.urlretrieve(Parameters.URL, filename=data_file)
            print('download completed.')
            with ZipFile(data_file, 'r') as zip:
                print('extracting files...')
                zip.extractall('./datasets/')
                print('done.')
            os.remove(data_file)
            execResult = True
        except Exception as ex:
            print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_ConvertJSONL(self, Parameters: ConvertJSONLParameter):
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()

        try:
            data_path = './datasets/' + Parameters.URL
            convert_mask_in_VOC_to_jsonl(data_path, self.ws)
            execResult = True
        except Exception as ex:
            print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_UploadJSONLImagesToDatastore(self, Parameters: UploadJSONLImagesToDatastoreParameter):
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()

        try:
            ds = self.ws.get_default_datastore()
            if Parameters.UploadFlag:
                ds.upload(src_dir='./datasets/' + Parameters.LocalTargetURL, target_path=Parameters.CloudTargetPath)

            training_dataset_name = Parameters.TrainingDatasetName  # 'odFridgeObjectsMaskTrainingDataset'
            if training_dataset_name in self.ws.datasets:
                self.training_dataset = self.ws.datasets.get(training_dataset_name)
                print('Found the training dataset', training_dataset_name)
            else:
                self.training_dataset = _LabeledDatasetFactory.from_json_lines(
                    task=LabeledDatasetTask.IMAGE_INSTANCE_SEGMENTATION,
                    path=ds.path(Parameters.CloudTargetPath + '/train_annotations.jsonl'))
                self.training_dataset = self.training_dataset.register(workspace=self.ws, name=training_dataset_name)

            # create validation dataset
            validation_dataset_name = Parameters.ValidationDatasetName  # "odFridgeObjectsMaskValidationDataset"
            if validation_dataset_name in self.ws.datasets:
                self.validation_dataset = self.ws.datasets.get(validation_dataset_name)
                print('Found the validation dataset', validation_dataset_name)
            else:
                self.validation_dataset = _LabeledDatasetFactory.from_json_lines(
                    task=LabeledDatasetTask.IMAGE_INSTANCE_SEGMENTATION,
                    path=ds.path(Parameters.CloudTargetPath + '/validation_annotations.jsonl'))
                self.validation_dataset = self.validation_dataset.register(workspace=self.ws,
                                                                           name=validation_dataset_name)
            print("Training dataset name: " + self.training_dataset.name)
            print("Validation dataset name: " + self.validation_dataset.name)
            execResult = True
        except Exception as ex:
            print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_SubmitAutoMLTask(self, Parameters: SubmitAutoMLTaskParameter):
        execResult = False
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()

        if self.experiment is None:
            print('experiment is None, Please Setup Experiment first.')
        else:
            try:
                if Parameters.HyperparameterSweeping:
                    parameter_space = {
                        'model_name': choice(Parameters.ModelChoice),
                        'learning_rate': uniform(Parameters.LearningRateMin, Parameters.LearningRateMax),
                        # 'warmup_cosine_lr_warmup_epochs': choice(0, 3),
                        'optimizer': choice('sgd', 'adam', 'adamw'),
                        'min_size': choice(600, 800),
                        'number_of_epochs': Parameters.NumberOfEpochs,
                        'training_batch_size': Parameters.TrainingBatchSize,
                        'split_ratio': Parameters.SplitRatio
                    }

                    if Parameters.TaskType == 'image-object-detection' or Parameters.TaskType == 'image-instance-segmentation':
                        parameter_space['validation_metric_type'] = Parameters.ODISValidationMetricType

                    if Parameters.ModelChoice == 'yolov5':
                        parameter_space['img_size'] = Parameters.Yolov5ImgSize

                    tuning_settings = {
                        'iterations': Parameters.Iterations,
                        'max_concurrent_iterations': Parameters.MaxConcurrentIterations,
                        'hyperparameter_sampling': RandomParameterSampling(parameter_space),
                        'policy': BanditPolicy(evaluation_interval=1, slack_factor=0.2, delay_evaluation=2)
                    }

                    image_config = AutoMLImageConfig(task=Parameters.TaskType,
                                                     compute_target=self.compute_target,
                                                     training_data=self.training_dataset,
                                                     validation_data=self.validation_dataset,
                                                     primary_metric='mean_average_precision',
                                                     **tuning_settings)
                    self.automl_task_run = self.experiment.submit(image_config)
                else:
                    image_config = AutoMLImageConfig(
                        task=ImageTask.IMAGE_INSTANCE_SEGMENTATION,
                        compute_target=self.compute_target,
                        training_data=self.training_dataset,
                        validation_data=self.validation_dataset,
                        hyperparameter_sampling=GridParameterSampling({'model_name': choice(Parameters.ModelChoice)}),
                        iterations=1
                    )
                    self.automl_task_run = self.experiment.submit(image_config)
                print(self.automl_task_run.get_status())
                # self.automl_task_run.wait_for_completion(wait_post_processing=True)
                execResult = True
            except Exception as ex:
                print(ex)

        sys.stdout = old_stdout
        return ExecResult(execResult, mystdout.getvalue())

    def exec_GetSubmitStatus(self) -> ExecResultGetSubmitStatus:
        execResult = False
        statusurl = ''
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()

        if self.automl_task_run is None:
            print('automl_task_run is None, Please Submit ML task first.')
        else:
            try:
                print(self.automl_task_run.get_status())
                # print(self.automl_task_run)
                # print(self.automl_task_run.experiment.name)
                # Running
                # Run(Experiment: automl-image-testing,
                # Id: AutoML_3d690755-166a-4001-98f7-8852dd7019e4,
                # Type: automl,
                # Status: Running)
                print('Task run info URL:')
                # print('https://ml.azure.com/experiments/'
                #       '{ExperimentName}'
                #       '/runs/'
                #       '{ID}'
                #       '?wsid=/subscriptions/'
                #       '{SubscriptionsId}'
                #       '/resourcegroups/'
                #       '{ResourceGroupsName}'
                #       '/workspaces/'
                #       '{WorkSpaceName}'.format(
                #     ExperimentName=self.automl_task_run.experiment.name,
                #     ID=self.automl_task_run.id,
                #     SubscriptionsId=self.ws.subscription_id,
                #     ResourceGroupsName=self.ws.resource_group,
                #     WorkSpaceName=self.ws.name
                # ))
                statusurl = 'https://ml.azure.com/experiments/{ExperimentName}/runs/{ID}?wsid=/subscriptions/{SubscriptionsId}/resourcegroups/{ResourceGroupsName}/workspaces/{WorkSpaceName}'.format(
                    ExperimentName=self.automl_task_run.experiment.name,
                    ID=self.automl_task_run.id,
                    SubscriptionsId=self.ws.subscription_id,
                    ResourceGroupsName=self.ws.resource_group,
                    WorkSpaceName=self.ws.name)
                execResult = True
            except Exception as ex:
                print(ex)

        sys.stdout = old_stdout
        return ExecResultGetSubmitStatus(execResult, mystdout.getvalue(), statusurl)


AutoMlModule = AzAutoMLModule()


@app.route('/workspacesetup', methods=['POST'])
def workspacesetup():
    jsonbody = request.get_json()
    WorkspaceSetupParameterValue = WorkspaceSetupParameter(
        jsonbody['workspacename'],
        jsonbody['subscriptionid'],
        jsonbody['resourcegroup'],
    )
    global AutoMlModule
    AutoMlModule = AzAutoMLModule()
    result = AutoMlModule.exec_WorkspaceSetup(WorkspaceSetupParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/computetargetsetup', methods=['POST'])
def computetargetsetup():
    jsonbody = request.get_json()
    ComputeTargetSetupParameterValue = ComputeTargetSetupParameter(
        jsonbody['ClusterName']
    )
    global AutoMlModule

    result = AutoMlModule.exec_ComputeTargetSetup(ComputeTargetSetupParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/experimentsetup', methods=['POST'])
def experimentsetup():
    jsonbody = request.get_json()
    ExperimentSetupParameterValue = ExperimentSetupParameter(
        jsonbody['ExperimentName']
    )
    global AutoMlModule

    result = AutoMlModule.exec_ExperimentSetup(ExperimentSetupParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/downloaddatasets', methods=['POST'])
def downloaddatasets():
    jsonbody = request.get_json()
    DownloadDatasetsParameterValue = DownloadDatasetsParameter(
        jsonbody['URL']
    )
    global AutoMlModule

    result = AutoMlModule.exec_DownloadDataSets(DownloadDatasetsParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/converttojsonl', methods=['POST'])
def converttojsonl():
    jsonbody = request.get_json()
    ConvertJSONLParameterValue = ConvertJSONLParameter(
        jsonbody['URL']
    )
    global AutoMlModule

    result = AutoMlModule.exec_ConvertJSONL(ConvertJSONLParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/uploadjsonlimagetodatastore', methods=['POST'])
def uploadjsonlimagetodatastore():
    jsonbody = request.get_json()
    UploadJSONLImagesToDatastoreParameterValue = UploadJSONLImagesToDatastoreParameter(
        jsonbody['UploadFlag'],
        jsonbody['LocalTargetURL'],
        jsonbody['CloudTargetPath'],
        jsonbody['TrainingDatasetName'],
        jsonbody['ValidationDatasetName']
    )
    global AutoMlModule

    result = AutoMlModule.exec_UploadJSONLImagesToDatastore(UploadJSONLImagesToDatastoreParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/submitautomltraining', methods=['POST'])
def submitautomltraining():
    jsonbody = request.get_json()
    SubmitAutoMLTaskParameterValue = SubmitAutoMLTaskParameter(
        jsonbody['HyperparameterSweeping'],
        jsonbody['TaskType'],
        jsonbody['ModelChoice'],
        jsonbody['LearningRateMin'],
        jsonbody['LearningRateMax'],
        jsonbody['Iterations'],
        jsonbody['MaxConcurrentIterations'],
        jsonbody['NumberOfEpochs'],
        jsonbody['TrainingBatchSize'],
        jsonbody['SplitRatio'],
        jsonbody['ODISValidationMetricType'],
        jsonbody['Yolov5ImgSize'],
    )
    global AutoMlModule

    result = AutoMlModule.exec_SubmitAutoMLTask(SubmitAutoMLTaskParameterValue)
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg}


@app.route('/getsubmitstatus', methods=['POST'])
def getsubmitstatus():
    global AutoMlModule
    result = AutoMlModule.exec_GetSubmitStatus()
    return {'ExecFlag': result.ExecFlag, 'Msg': result.Msg, 'url': result.StatusUrl}


@app.route('/datasets/<path:path>')
def datasets(path):
    return send_from_directory('datasets', path)


@app.route('/clients/<path:path>')
def clients(path):
    return send_from_directory('clients', path)


@app.route('/static/<path:path>')
def clientsStatic(path):
    return send_from_directory('clients/static', path)


port = os.getenv('PORT', '18080')
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(port))
