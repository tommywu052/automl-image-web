import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import { ExecResponse } from './Contract';
import { stringIsBlank } from './generalutility';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingProgressDialog from "./LoadingProgressDialog";
import ImagePreviewDialog from './ImagePreviewDialog';

const Hosts = 'http://127.0.0.1:8080';

function App() {
  // loading
  const [LoadingFlag, setLoadingFlag] = useState(false);
  // Status
  const [StepIndex, setStepIndex] = useState(0);
  // Workspace Setup
  const [SubscriptionValue, setSubscriptionValue] = useState("");
  const [ResourceGroupValue, setResourceGroupValue] = useState("");
  const [WorkspaceNameValue, setWorkspaceNameValue] = useState("");
  // Compute target setup
  const [ClusterNameValue, setClusterNameValue] = useState("gpu-cluster-nc6");
  // Experiment Setup
  const [ExperimentNameValue, setExperimentNameValue] = useState("automl-image-testing");
  // DataSets
  const [DataSets_PreviewImageFlag, setDataSets_PreviewImageFlag] = useState(false);
  const [DataSets_DownloadURL, setDataSets_DownloadURL] = useState("https://cvbp-secondary.z19.web.core.windows.net/datasets/object_detection/odFridgeObjectsMask.zip");
  const [DataSets_PreviewImageURL, setDataSets_PreviewImageURL] = useState("/odFridgeObjectsMask/images/31.jpg");
  const [DataSets_ConvertToJSONLURL, setDataSets_ConvertToJSONLURL] = useState("odFridgeObjectsMask/");
  // Upload To DataStore
  const [Upload_LocalTargetURL, setUpload_LocalTargetURL] = useState('odFridgeObjectsMask');
  const [Upload_CloudTargetPath, setUpload_CloudTargetPath] = useState('odFridgeObjectsMask');
  const [Upload_TrainingDatasetName, setUpload_TrainingDatasetName] = useState('odFridgeObjectsMaskTrainingDataset');
  const [Upload_ValidationDatasetName, setUpload_ValidationDatasetName] = useState('odFridgeObjectsMaskValidationDataset');
  // AutoML Task
  const [AutoML_TaskType, setAutoML_TaskType] = useState('image-instance-segmentation');
  const [AutoML_ModelChoice, setAutoML_ModelChoice] = useState('maskrcnn_resnet50_fpn');
  // let loginit: string[] = [];
  const [ExecLog, setExecLog] = useState('');
  const [ExecFlag, setExecFlag] = useState(false);

  const FuncWorkspaceSetup = () => {
    setLoadingFlag(true);

    if (stringIsBlank(SubscriptionValue)) {
      toast.error('Invalid Subscription Id.');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(ResourceGroupValue)) {
      toast.error('Invalid Resource Group.');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(WorkspaceNameValue)) {
      toast.error('Invalid Workspace Name.');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/workspacesetup", {
          workspacename: WorkspaceNameValue,
          subscriptionid: SubscriptionValue, //SubscriptionValue
          resourcegroup: ResourceGroupValue,
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');

          setStepIndex(result.ExecFlag ? 1 : 0);
          // setStepIndex(1);
        })
        .catch((e) => {
          setLoadingFlag(false);
        });
    }
  };
  const FuncComputeTargetSetup = () => {
    setLoadingFlag(true);

    if (stringIsBlank(ClusterNameValue)) {
      toast.error('Invalid Cluster Name.');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/computetargetsetup", {
          ClusterName: ClusterNameValue
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');

          setStepIndex(result.ExecFlag ? 2 : 1);
          // setStepIndex(2);
        }).catch((e) => {
          setLoadingFlag(false);
        });
    }
  }
  const FuncExperimentSetup = () => {
    setLoadingFlag(true);

    if (stringIsBlank(ExperimentNameValue)) {
      toast.error('Invalid Experiment Name.');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/experimentsetup", {
          ExperimentName: ExperimentNameValue
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');

          setStepIndex(result.ExecFlag ? 3 : 2);
          // setStepIndex(3);
        }).catch((e) => {
          setLoadingFlag(false);
        });
    }
  }
  const FuncDownloadDataSets = () => {
    setLoadingFlag(true);

    if (stringIsBlank(DataSets_DownloadURL)) {
      toast.error('Invalid download URL.');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/downloaddatasets", {
          URL: DataSets_DownloadURL
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');
        }).catch((e) => {
          setLoadingFlag(false);
        });
    }
  }
  const FuncConvertToJSONL = () => {
    setLoadingFlag(true);

    if (stringIsBlank(DataSets_ConvertToJSONLURL)) {
      toast.error('Invalid ConvertToJSONLURL');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/converttojsonl", {
          URL: DataSets_ConvertToJSONLURL
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');
        }).catch((e) => {
          setLoadingFlag(false);
        });
    }
  }
  const FuncUploadDataSetsToDataStore = () => {
    setLoadingFlag(true);

    if (stringIsBlank(Upload_LocalTargetURL)) {
      toast.error('Invalid Local Target URL.');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(Upload_CloudTargetPath)) {
      toast.error('Invalid Cloud Target Path.');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(Upload_TrainingDatasetName)) {
      toast.error('Invalid Training Dataset Name.');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(Upload_ValidationDatasetName)) {
      toast.error('Invalid Validation Dataset Name.');
      setLoadingFlag(false);
    }
    else {
      axios
        .post(Hosts + "/uploadjsonlimagetodatastore", {
          LocalTargetURL: Upload_LocalTargetURL,
          CloudTargetPath: Upload_CloudTargetPath,
          TrainingDatasetName: Upload_TrainingDatasetName,
          ValidationDatasetName: Upload_ValidationDatasetName
        })
        .then((v) => {
          // console.log(v);
          let result = v.data as ExecResponse;
          setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
          setExecFlag(result.ExecFlag);
          setLoadingFlag(false);
          result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');
        }).catch((e) => {
          setLoadingFlag(false);
        });
    }
  }
  const FuncSubmitTrainingTask = () => {
    setLoadingFlag(true);

    if (stringIsBlank(AutoML_TaskType)) {
      toast.error('Invalid Task Type');
      setLoadingFlag(false);
    }
    else if (stringIsBlank(AutoML_ModelChoice)) {
      toast.error('Invalid Model Choice');
      setLoadingFlag(false);
    }
    else {
      let valid = false;
      if (AutoML_TaskType === 'image-classification' || AutoML_TaskType === 'image-multi-labeling') {
        if (AutoML_ModelChoice === 'resnet18' ||
          AutoML_ModelChoice === 'resnet34' ||
          AutoML_ModelChoice === 'resnet50' ||
          AutoML_ModelChoice === 'mobilenetv2' ||
          AutoML_ModelChoice === 'seresnext') {
          valid = true;
        }
      }
      else if (AutoML_TaskType === 'image-object-detection') {
        if (AutoML_ModelChoice === 'yolov5' ||
          AutoML_ModelChoice === 'fasterrcnn_resnet50_fpn' ||
          AutoML_ModelChoice === 'fasterrcnn_resnet34_fpn' ||
          AutoML_ModelChoice === 'fasterrcnn_resnet18_fpn' ||
          AutoML_ModelChoice === 'retinanet_resnet50_fpn') {
          valid = true;
        }
      }
      else if (AutoML_TaskType === 'image-instance-segmentation' && AutoML_ModelChoice === 'maskrcnn_resnet50_fpn') {
        valid = true;
      }
      else {
        toast.error('Invalid TaskType and ModelChoice');
        setLoadingFlag(false);
      }

      if (valid) {
        axios
          .post(Hosts + "/submitautomltraining", {
            TaskType: AutoML_TaskType,
            ModelChoice: AutoML_ModelChoice
          })
          .then((v) => {
            // console.log(v);
            let result = v.data as ExecResponse;
            setExecLog(result.ExecFlag ? result.Msg : 'Error:\n' + result.Msg);
            setExecFlag(result.ExecFlag);
            setLoadingFlag(false);
            result.ExecFlag ? toast.info('Completed.') : toast.error('Error!');
          }).catch((e) => {
            setLoadingFlag(false);
          });
      }
      else {
        toast.error('TaskType and ModelChoice Invalid. The categories should be the same.');
        setLoadingFlag(false);
      }
    }
  }

  return (
    <div className="h-screen">
      {
        DataSets_PreviewImageFlag &&
        <ImagePreviewDialog
          url={Hosts + '/datasets/' + DataSets_PreviewImageURL}
          title={DataSets_PreviewImageURL}
          closeCallback={() => setDataSets_PreviewImageFlag(false)} />
      }
      <ToastContainer />
      {
        LoadingFlag && <LoadingProgressDialog title={'Running...'} />
      }
      <div className="m-2">
        <h1 className="text-white font-bold text-2xl">Experiment AutoML</h1>
      </div>
      <div className="flex h-auto">
        <div className="w-1/2 h-full bg-gray-400 p-2 m-1 rounded-md">
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-green-300 text-black">
              1. Workspace setup
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Subscription id:
                </label>
                <div className="ml-2 w-1/2">
                  {
                    StepIndex > 0 ?
                      SubscriptionValue :
                      <input
                        value={SubscriptionValue}
                        onChange={(e) => setSubscriptionValue(e.target.value)}
                        type="text"
                        className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                  }
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Resource Group:
                </label>
                <div className="ml-2 w-1/2">
                  {
                    StepIndex > 0 ?
                      ResourceGroupValue :
                      <input
                        value={ResourceGroupValue}
                        onChange={(e) => setResourceGroupValue(e.target.value)}
                        type="text"
                        className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                        placeholder="resource_group"
                      />
                  }
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Workspace Name:
                </label>
                <div className="ml-2 w-1/2">
                  {
                    StepIndex > 0 ?
                      WorkspaceNameValue :
                      <input
                        value={WorkspaceNameValue}
                        onChange={(e) => setWorkspaceNameValue(e.target.value)}
                        type="text"
                        className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                        placeholder="workspace_name"
                      />
                  }
                </div>
                <div className="ml-auto">
                  {
                    StepIndex === 0 && <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={FuncWorkspaceSetup}
                    >
                      Setup and Login
                  </button>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-green-300 text-black">
              2. Compute target setup
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Cluster_name:
                </label>
                <div className="ml-2 w-1/2">
                  {
                    StepIndex > 1 ?
                      ClusterNameValue :
                      <input
                        value={ClusterNameValue}
                        onChange={(e) => setClusterNameValue(e.target.value)}
                        type="text"
                        className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                        placeholder="cluster_name"
                      />
                  }
                </div>
                <div className="ml-auto">
                  {
                    StepIndex === 1 &&
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={FuncComputeTargetSetup}>
                      setup
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-green-300 text-black">
              3. Experiment Setup
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Experiment Name:
                </label>
                <div className="ml-2 w-1/2">
                  {
                    StepIndex > 2 ?
                      ExperimentNameValue :
                      <input
                        value={ExperimentNameValue}
                        onChange={(e) => setExperimentNameValue(e.target.value)}
                        type="text"
                        className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                        placeholder="experiment_name"
                      />
                  }
                </div>
                <div className="ml-auto">
                  {
                    StepIndex === 2 &&
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={FuncExperimentSetup}>
                      setup
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-yellow-600 text-black">
              4. Dataset Operation
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Download URL:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={DataSets_DownloadURL}
                    onChange={(e) => setDataSets_DownloadURL(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={FuncDownloadDataSets}>
                    Download
                  </button>
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Preview Image:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={DataSets_PreviewImageURL}
                    onChange={(e) => setDataSets_PreviewImageURL(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => { setDataSets_PreviewImageFlag(true) }}>
                    Preview
                  </button>
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Convert To JSONL:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={DataSets_ConvertToJSONLURL}
                    onChange={(e) => setDataSets_ConvertToJSONLURL(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={FuncConvertToJSONL}>
                    Convert
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-yellow-600 text-black">
              5. Upload JSONL file and images to Datastore
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Local Target URL:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={Upload_LocalTargetURL}
                    onChange={(e) => setUpload_LocalTargetURL(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Cloud Target Path:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={Upload_CloudTargetPath}
                    onChange={(e) => setUpload_CloudTargetPath(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Training Dataset Name:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={Upload_TrainingDatasetName}
                    onChange={(e) => setUpload_TrainingDatasetName(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Validation Dataset Name:
                </label>
                <div className="ml-2 w-3/5">
                  <input
                    value={Upload_ValidationDatasetName}
                    onChange={(e) => setUpload_ValidationDatasetName(e.target.value)}
                    type="text"
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    placeholder="url"
                  />
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={FuncUploadDataSetsToDataStore}>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-auto p-2 mt-2 bg-yellow-100 rounded-md">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-pink-500 text-black">
              6. AutoML run for image tasks
            </span>
            <div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Task Type:
                </label>
                <div className="ml-2 w-3/5">
                  <select
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    value={AutoML_TaskType}
                    onChange={(e) => setAutoML_TaskType(e.target.value)}>
                    <option value={'image-classification'}>image-classification</option>
                    <option value={'image-multi-labeling'}>image-multi-labeling</option>
                    <option value={'image-object-detection'}>image-object-detection</option>
                    <option value={'image-instance-segmentation'}>image-instance-segmentation</option>
                  </select>
                </div>
              </div>
              <div className="flex m-3">
                <label className="font-medium text-black">
                  Model Choice:
                </label>
                <div className="ml-2 w-3/5">
                  <select
                    className="shadow-sm border-2 border-gray-400 rounded-md w-full"
                    value={AutoML_ModelChoice}
                    onChange={(e) => setAutoML_ModelChoice(e.target.value)}>
                    <option value={'resnet18'}>Image Classification: resnet18</option>
                    <option value={'resnet34'}>Image Classification: resnet34</option>
                    <option value={'resnet50'}>Image Classification: resnet50</option>
                    <option value={'mobilenetv2'}>Image Classification: mobilenetv2</option>
                    <option value={'seresnext'}>Image Classification: seresnext</option>
                    <option value={'yolov5'}>Object Detection (OD): yolov5</option>
                    <option value={'fasterrcnn_resnet50_fpn'}>Object Detection (OD): fasterrcnn_resnet50_fpn</option>
                    <option value={'fasterrcnn_resnet34_fpn'}>Object Detection (OD): fasterrcnn_resnet34_fpn</option>
                    <option value={'fasterrcnn_resnet18_fpn'}>Object Detection (OD): fasterrcnn_resnet18_fpn</option>
                    <option value={'retinanet_resnet50_fpn'}>Object Detection (OD): retinanet_resnet50_fpn</option>
                    <option value={'maskrcnn_resnet50_fpn'}>Instance segmentation (IS): maskrcnn_resnet50_fpn</option>
                  </select>
                </div>
                <div className="ml-auto">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={FuncSubmitTrainingTask}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-auto bg-black p-2 m-1 rounded-md">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xl font-medium bg-white text-black">
            AutoML Log
          </span>
          <div className="text-white mt-2 h-5/6 rounded-md">
            {
              ExecFlag ?
                <textarea className="w-full h-full rounded-md text-xl font-bold text-black p-3" value={ExecLog}></textarea> :
                <textarea className="w-full h-full rounded-md text-xl font-bold text-red-600 p-3" value={ExecLog}></textarea>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
