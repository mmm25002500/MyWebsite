# MyWebsite - Documentation

This website is currently the latest version. The previous version was developed using Vue Cli([old branch](tree/old/)) due to much dirty code, and this version has been rebuilt using Next.js and TypeScript.

## Structure
### API
#### ADDR
Path: `/api/{name}?lebel_1=val_1&label2=val_2&...`
#### APIs List
| API | Input | Output | Intro |
| --- | --- | --- | --- |
| x | x | x | x |

### Used APIs
| Label | Provider |
| -------- | -------- |
| x | x |

### Used Resources
| Label | Provider |
| ---- | ---- |
| Post Backend | Firebase |
| Backend Server | Vercel |
| Frontend Server | Vercel |

## Hot Reloading & Deployment
### pnpm (recommendation)
```bash
# install necessary pkg
pnpm i
# hot reloading dev
pnpm dev
# deploy & compile
pnpm build
```
### npm (Not recommended)
```bash
# install necessary pkg
npm i
# hot reloading dev
npm run dev
# deploy & compile
npm run build
```
### yarn (Not recommended)
```bash
# install necessary pkg
yarn
# hot reloading dev
yarn dev
# deploy & compile
yarn build
```