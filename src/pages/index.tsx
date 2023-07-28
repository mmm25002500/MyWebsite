import Alert from "@/components/Alert";
import Card from "@/components/Card";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Index = () => {
  return (
    <div className="container mx-auto mt-2 pl-5 pr-5 md:pl-10 md:pr-10 transition-colors duration-100">
      <Alert color="cyan" close={ true }>
        <FontAwesomeIcon icon={faInfoCircle} className="w-5 mr-1"></FontAwesomeIcon>
        <p>目前版本：v2.0 夏特稀新版的個人網站正在開發中...
          <a className="underline underline-offset-4" href="https://tershi.com" target="_blank">點此回到舊版網站</a>
        </p>
      </Alert>

      <h1 className="text-4xl mb-2">夏特稀個人網站</h1>
      <p>一個正在讀大學的學生</p>
      <p>為了台灣資訊安全與自己的夢想而努力</p>
      <Card className="bg-cyan-300/40 mt-2">
        <div className="sm:grid sm:grid-cols-4 gap-4">
          <div className="border-b-4 border-cyan-300 sm:border-0 pb-2 mb-2 sm:pb-0 sm:mb-0">
            <p className="text-2xl font-bold text-center sm:text-left">夏特稀</p>
            {/* style="border: 2px solid rgb(0, 255, 254); width: 100px; height: 100px;" */}
            <img className="block mx-auto h-24 rounded-full border-solid border-2 border-[#00ffff] sm:mx-0 sm:shrink-0" src="/images/img.webp"  />
          </div>
          <div className="sm:col-span-3 sm:flex text-center sm:text-left">
            <div className="sm:w-64 border-b-4 border-cyan-300 sm:border-0">
              <p className="text-lg font-semibold">經歷</p>
              <ul className="list-disc list-inside">
                <li>國二考到OCPJP</li>
                <li>資訊月競賽中區第二名</li>
                <li>Google Study Jam</li>
                <li>Linux 6年經驗</li>
                <li>111年特殊選才正取一</li>
              </ul>
            </div>
            <div className="sm:w-52 border-b-4 border-cyan-300 sm:border-0">
              <p className="text-lg font-semibold">個人資料</p>
              <ul className="list-disc list-inside">
                <li>暱稱：夏特稀</li>
                <li>性別：小男生</li>
                <li>科系：資工系</li>
              </ul>
            </div>
            <div className="sm:w-52 border-b-4 border-cyan-300 sm:border-0">
            <p className="text-lg font-semibold">統計資料</p>
            <ul className="list-disc list-inside">
              <li>女友：0</li>
              <li>男友：0</li>
            </ul>
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}

export default Index;
