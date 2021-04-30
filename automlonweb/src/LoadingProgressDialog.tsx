import "./loadingprogressdialog.css";
import { stringIsBlank } from './generalutility';
export default function LoadingProgressDialog(props: { title?: string, msg?: string } = { msg: '' }) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-90 flex flex-col items-center justify-center">
      <div className="bg-black w-2/12 h-1/4 border-2 rounded-xl flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
        <h2 className="text-center text-white text-xl font-semibold">
          {stringIsBlank(props.title) ? 'Loading...' : props.title}
        </h2>
        <p className="w-10/12 text-center text-white">{props.msg}</p>
      </div>
    </div>
  );
}
