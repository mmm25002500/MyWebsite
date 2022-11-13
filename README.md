# 夏特稀個人網站
夏特稀官方網站，一個使用 vue cli 框架建構的網站，這裡有夏特稀的生活、介紹、作品集、團隊、專案，是夏特稀夢想的源泉，是夏特稀靈感的聚集地，是永恆不滅的精神。

## 專案設定
1. 安裝依賴至 node_modules: ```npm i```

請注意！如果有依賴問題，可以嘗試使用```--legacy-peer-deps```參數安裝。


### 執行

npm: ```npm run serve```

yarn: ```yarn && yarn serve```

### 編譯

npm: ```npm run build```

yarn: ```yarn run build```

編譯完成後，會出現一個 ```dist/``` 資料夾，此資料夾為編譯後的可執行文件，以你的網頁瀏覽器打開即可運行，此動作將 Vue 打包成 Webpack。

## 貢獻
如果你想貢獻夏特稀個人網站，我本人十分歡迎呦~~~ mua，我分為以下幾個步驟。

### Fork
首先按下右上角的 Fork 鈕，將本專案複製一分至你的本地 Repository，你會看到最新版本的 code。

### 修改並重發布

如果你是想重新發布一個跟夏特稀個人網站一樣的版面，只是文字與圖片有所差異的話，那以下文件夾你必須了解哪個可以更動哪個不行。
| 文件夾 | 是否可更動 |
| ------ | --------- |
| .gitignore | 不可以 |
| .eslintrc.js | 不可以 |
| LICENCE | 不可以 |
| vue.config.js | 不可以 |
| main.js | 允許更動文字部分 |
| node_modules/ | 不可以 |
| public/ | 允許更動某些部分 |
| assets/js/ | 不可以 |
| assets/css/ | 不可以 |
| assets/sass/ | 不可以 |
| assets/webfonts/ | 不可以 |
| assets/bs/ | 不可以 |
| assets/all.scss | 不可以 |

### 修改並貢獻本專案

如果你想完善程式碼並回推至本 Repository，請勿動 ```.gitignore```

### 回推

假設你已經修改完本專案了，請在你本地的 Repository 建立一個 Pull Requests 並推至本倉庫，我會認真看你每一行所修改的程式碼，如果沒有問題，我就會 merge。如果成功 Merge 後，那就恭喜你成為本專案的貢獻者瞜~~~