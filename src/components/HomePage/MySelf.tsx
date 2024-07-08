import Image from "next/image";
import Card from "../Card/Card";
import IconBtn from "../Button/IconBtn";
import Icon from "../Icon";
import { Tooltip } from "@material-tailwind/react";
import { useRouter } from "next/router";

const MySelf = () => {
  const router = useRouter();

  return (
    <Card className="relative flex gap-4 bg-neutral-300 dark:bg-neutral-700/40 mt-2">
      <Tooltip content="查看更多" placement="top">
        <div className="absolute right-2 top-2 text-xl">
          <IconBtn onClick={() => router.push('/about')}>
            <Icon iconName={"magnifying-glass"} prefix={"fas"} className="w-4 h-4" />
          </IconBtn>
        </div>
      </Tooltip>

      <div className="flex-none">
        <Image
          src="/images/img.webp"
          alt="夏特稀"
          className="block mx-auto h-24 rounded-full border-solid border-2 border-cyan-700 sm:mx-0 sm:shrink-0"
          width={100}
          height={100}
        />
        <p className="text-2xl font-bold text-center">夏特稀</p>
      </div>
      <div className="">
        <button
          className="text-xl font-semibold"
          onClick={() => { }}
        >
          自我介紹
        </button>
        <p className="mt-2 text-base font-normal">
          我是一個來自台灣的大學生，從小透過自主學習的方式，學習程式設計，小五開始學習網頁前端，國中開始觸碰程式設計和資訊安全。我的個性有時內向，有時外向，平常不太說話，但是如果有表現的機會也會努力展現自我，我對許多事物保有好奇心，喜歡探究未知的領域和思考。
        </p>
      </div>
    </Card>
  )
}

export default MySelf;
