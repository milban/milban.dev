---
date: '2021-01-07T00:03'
title: 'SPA기반 SSR 구현하기 (feat.React) 3-SSR용 서버 구현과 Hydration'
---

SSR은 개념편에서 말했듯이 `서버에서 렌더링을 하는 것`입니다. 이를 위한 서버를 구현하겠습니다.
또한 SSR에서 중요한 개념 중 하나인 `Hydration`에 대해서 알아보겠습니다.

_해당 과정 중 많은 부분을 출처의 [실전 리액트 프로그래밍 (이재승 저)](https://medium.com/@ljs0705/%EC%8B%A4%EC%A0%84-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B0%9C%EC%A0%95%ED%8C%90-%EC%86%8C%EC%8B%9D-d6d7a77e1c52)책을 참고하여 작성하였습니다._
_문제가 될 시 wnsgur6311@gmail.com으로 연락부탁드립니다._


### 패키지 설치

```bash
npm i express
npm i -D @babel/cli @babel/plugin-transform-modules-commonjs
```
* `@babel/plugin-transform-modules-commonjs` <br/>
서버 사이드에서 `import/export`문법을 사용하기 위해 설치합니다.

### 웹 서버 코드 작성

- `src/server.js`

    ```jsx
    import express from 'express';
    import fs from 'fs';
    import path from 'path';
    import { renderToString } from 'react-dom/server';
    import React from 'react';
    import App from './App';

    const app = express();
    const html = fs.readFileSync(
    	path.resolve(__dirname, '../dist/index.html'),
    	'utf8',
    ); // (1)
    app.use('/dist', express.static('dist')); // (2)
    app.get('/favicon.ico', (req, res) => res.sendStatus(204)); // (3)
    app.get('*', (req, res) => {
    	const renderString = renderToString(<App page="home" />); // (4)
        const result = html.replace(
    		'<div id="root"></div>',
    		`<div id="root">${renderString}</div>`,
    	); // (5)
    	res.send(result);
    });
    app.listen(3000);
    ```

    - (1) CSR구현편에서 작성했던 html파일을 읽어옵니다.
    - (2) `http://localhost:3000/dist/main.23427ea2a2813f223cb6.js` 와 같이 url이  `/dist` 로 시작하는 경우 `dist 폴더 밑에 있는 정적파일` 을 서빙합니다.
          `dist 폴더 밑에 있는 정적파일`은 클라이언트 코드가 모듈번들러인 Webpack을 통해 번들링 된 결과물들입니다.
        - [express use api](https://expressjs.com/ko/guide/using-middleware.html)
        - [express static api](https://expressjs.com/ko/starter/static-files.html)
    - (3) 브라우저에서 자동으로 요청하는 favicon을 우선 처리하기 위한 코드입니다.
    - (4) `renderToString` api를 이용해 `<App ... />`컴포넌트를 렌더링하고 그 결과를 문자열로 반환합니다.
        - [React renderToString api](https://ko.reactjs.org/docs/react-dom-server.html#rendertostring)
    - (5) 읽어왔던 빈 html파일에 (4)과정에서 렌더링한 결과물을 채워넣어줍니다. <br/>
    
위 과정들로 인해 개념편에서 말한 SSR 장점 중 하나인 `최초 요청 시, 서버에서 사용자에게 렌더링할 준비가 된 full HTML 파일을 보내준다.`를 만족하게 됩니다.
 
<br/>
 
이제 서버를 위한 환경설정을 하겠습니다.

### 서버를 위한 바벨 설정

- `.babelrc.common.js`

    ```js
    const presets = ['@babel/preset-react'];
    const plugins = [];
    module.exports = { presets, plugins };
    ```

`@babel/preset-react` 프리셋은 클라이언트 환경과 서버 환경 둘 다에서 사용됩니다.<br/>
클라이언트에서는 React를 사용하고 서버에서도 위 코드에서처럼 React를 사용하기 때문입니다.

- `.babelrc.client.js`

    ```js
    const config = require('./.babelrc.common.js');
    config.presets.push('@babel/preset-env');
    module.exports = config;
    ```
  
공통으로 사용되는 바벨설정을 가져오고, 클라이언트 환경에서만 필요한 `@babel/preset-env`프리셋을 포함시킵니다. 

- `.babelrc.server.js`

    ```js
    const config = require('./.babelrc.common.js');
    config.plugins.push('@babel/plugin-transform-modules-commonjs');
    module.exports = config;
    ```

공통으로 사용되는 바벨설정을 가져오고, 클라이언트 환경에서만 필요한 `@babel/plugin-transform-modules-commonjs`프리셋을 포함시킵니다.

### 웹팩 설정 수정

- `webpack.config.js`

    ```jsx
    const path = require('path');
    const HtmlWebpackPlugin = require('html-webpack-plugin');

    module.exports = {
      entry: './src/index.js',
      output: {
        filename: "[name].[chunkhash].js",
        path: path.resolve(__dirname, 'dist'),
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    configFile: path.resolve(__dirname, '.babelrc.client.js'), // (1)
                },
            },
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: "./template/index.html",
          publicPath: '/dist/', // (2)
        })
      ],
      mode: "production",
      devServer: {
        historyApiFallback: true,
      }
    }
    ```

    - (1) 모듈 번들러인 Webpack은 클라이언트 코드를 번들하기 위한 것입니다. 따라서 `babel-loader`의 설정 파일을 위에서 작성했던 `.babelrc.client.js`로 설정해줍니다.
    - (2) HTML 내부 리소스 파일의 경로를 만들 때 사용됩니다.
          해당 예제처럼 사용하면 `<script src="/dist/main.9f59bb361a4c3dc2057b.js"></script>` 와 같이 `script src`가 `/dist/` 로 시작하게 됩니다.
            [html-webpack-plugin option](https://github.com/jantimon/html-webpack-plugin#options)

### Hydration

`Hydration`의 사전적 의미 중 SSR 구현과정에 잘 어울리는 의미는 `흡수`라고 생각합니다. ~~영어를 잘 못하므로 참고만해주세요.~~ 제가 설명하는 `Hydration`을 읽어보시고 적절한지 알려주세요. :)<br/>

우리는 지금까지 서버에서 React로 작성된 코드를 실행시켜 렌더링하고 그 결과물을 문자열 형식의 HTML로 응답했습니다. 이 응답은 클라이언트 사이드의 브라우저에서 렌더링을 과정을 거쳐 유저 화면에 나타나게 됩니다.
서버에서 응답한 HTML에 JS가 필요한 로직, 인터랙션이 없다면 이대로도 문제가 없지만, 우리는 React를 사용해서 DOM을 조작하고 로직과 인터랙션을 실행시킵니다. React로 DOM을 조작하기 위해선 React에 현재 DOM을 알게 해야합니다.
이 과정을 `Hydration`이라고 부르고, 저는 React가 DOM을 흡수한다고 생각했기 때문에 앞서 `흡수`라는 표현을 사용했습니다. 잘 어울리나요? <br/>

보통 CSR에서는 HTML파일의 컨텐츠가 비어오기 때문에 React의 `render`함수를 이용해 컨텐츠를 생성해 DOM을 채워넣게 되고, 자연스럽게 React는 현재 DOM을 알게됩니다.
하지만 SSR의 결과로 이미 HTML에 컨텐츠가 존재하는 상황에서 React의 `render`함수를 통해 다시 컨텐츠를 생성해내고 DOM을 채워넣는건 비효율적인 일입니다.
그래서 React에서는 `hydrate`라는 api를 제공해 기존에 존재하는 HTML의 내용을 React가 `흡수`할 수 있도록 합니다.
`hydrate` api가 동작하는 과정에서 HTML의 내용을 기반으로 React의 가상돔이 생성되고 React는 이 가상돔을 기반으로 향후 DOM을 조작하게 됩니다.<br/>

`src/index.js`파일을 다음과 같이 수정해주세요.

- `src/index.js`

    ```jsx
    import React from 'react';
    import ReactDom from 'react-dom';
    import App from "./App";

    ReactDom.hydrate(<App page="home" />, document.getElementById('root'));
    ```

### 실행확인

이제 구현된 기능들을 실행해 확인해봅시다.

#### 실행명령어

```bash
babel src --out-dir dist-server --config-file ./.babelrc.server.js # (1)
webpack # (2)
node dist-server/server.js #(3)
```
* (1) 서버 구동을 위해 소스 코드를 `babel`을 이용해 트랜스파일합니다.
* (2) `Webpack`을 이용해 클라이언트 소스를 번들링합니다.
* (3) 서버를 실행시킵니다.

`localhost:3000`에 접속한 후에 `개발자도구 > Network > Doc`항목의 `Response`를 보시면 `<div id="root"></div>`내부에 `Home`, `About`등의 컨텐츠로 채워져있는 것을 확인할 수 있습니다.

#### 실행명령어 script로 등록

위 실행 명령어들은 계속 쓰일 예정이니 스크립트로 등록하겠습니다.

* `package.json`
    ```json
    {
        ...
        "scripts": {
            "build:server": "babel src --out-dir dist-server --config-file ./.babelrc.server.js",
            "build:client": "webpack",
            "build": "npm run build:server && npm run build:client",
            "start": "node dist-server/server.js"
        }
        ...
    }
    ```
  

### 마무리
여기까지 SSR 구현을 위한 기능 중 가장 기본적인 서버에서의 렌더링을 구현했습니다.<br/>
다음 편에서는 서버 사이드에서 클라이언트 사이드로 데이터를 전달하는 방법을 알아보겠습니다.

## 출처
- [실전 리액트 프로그래밍 (이재승 저)](https://medium.com/@ljs0705/%EC%8B%A4%EC%A0%84-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B0%9C%EC%A0%95%ED%8C%90-%EC%86%8C%EC%8B%9D-d6d7a77e1c52)
- [Hydration and Server-side Rendering](https://blog.somewhatabstract.com/2020/03/16/hydration-and-server-side-rendering/)