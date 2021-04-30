export default function ImagePreviewDialog(props: { url: string, title: string, closeCallback: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-90 flex flex-col items-center justify-center">
      <div className="bg-black w-auto h-auto border-2 rounded-xl flex flex-col items-center justify-center">
        <div className="p-2">
          <div className="w-full flex relative pb-1">
            <div className="pt-1">
              <span className="text-white align-middle">{props.title}</span>
            </div>
            <div className="ml-auto">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={props.closeCallback}>
                X
              </button>
            </div>
          </div>
          <img className="rounded-md" src={props.url} alt="" />
        </div>
      </div>
    </div>
  );
}
