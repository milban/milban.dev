---
date: '2021-01-07T00:02'
title: 'SPA기반 SSR 구현하기 (feat.React) 2-프로젝트 시작 및 CSR 구현'
--- 

해당 편에서는 SSR 구현과정 중 프로젝트 시작 및 CSR 구현을 다룹니다. <br/>
SSR 구현에 CSR이 왜 필요한지 의문을 가질 수 있습니다. <br/>
CSR이 필요한 이유는 SPA기반 SSR은 CSR 앱을 이용해 서버에서 렌더링하는 것이기 때문입니다.
또한 SPA기반 SSR은 클라이언트가 페이지에 최초 접속시, 정확히 말하자면 SSR을 담당하는 서버에 요청을 보내는 과정에서만 SSR이 이루어지고,
그 이후 렌더링 과정은 CSR로 이루어지기 때문입니다.

_해당 과정 중 많은 부분을 출처의 [실전 리액트 프로그래밍 (이재승 저)](https://medium.com/@ljs0705/%EC%8B%A4%EC%A0%84-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B0%9C%EC%A0%95%ED%8C%90-%EC%86%8C%EC%8B%9D-d6d7a77e1c52)책을 참고하여 작성하였습니다._
_문제가 될 시 wnsgur6311@gmail.com으로 연락부탁드립니다._


### 패키지 설치

```bash
npm init -y
npm i react react-dom
# 바벨
npm i -D @babel/core @babel/preset-env @babel/preset-react
# 웹팩
npm i -D webpack webpack-cli babel-loader html-webpack-plugin webpack-dev-server
```
* `npm i react react-dom` <br/>
해당 글에서는 CSR을 React에 의존해 구현하므로 React 사용에 필요한 패키지를 설치합니다.
  
* `npm i -D @babel/core @babel/preset-env @babel/preset-react` <br/>
해당 글에서는 ES6 이상의 문법을 사용할 예정이므로 `@babel/preset-env` 프리셋을 사용합니다.<br/>
또한 React의 `JSX` 문법을 사용하기 위해 `@babel/preset-react` 프리셋을 사용합니다.
  
* `npm i -D webpack webpack-cli babel-loader html-webpack-plugin webpack-dev-server` <br/>
모듈 번들러로써 Webpack을 사용합니다. 이를 위해 `webpack`을 사용하고, `cli`로 `webpack`을 사용하기 위해 `webpack-cli`도 사용합니다. <br/>
번들 과정에서 Babel을 사용하기 위해 `babel-loader`도 설치합니다.<br/>
번들된 파일을 수동으로 html 파일에 넣어주는 과정을 피하기 위해 `html-webpack-plugin`을 사용합니다. <br/>
개발 서버를 사용하기 위해 `webpack-dev-server`도 사용합니다.
  
<br />

_위 내용이 어려우신 분들은 제 글 중 [[환경설정] CRA환경 구현해보기](https://milban.dev/[%ED%99%98%EA%B2%BD%EC%84%A4%EC%A0%95]%20CRA%ED%99%98%EA%B2%BD%20%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0/)를 읽어보시거나
트랜스파일, 모듈 번들러등의 프론트엔드 개발환경을 공부해보시는 것을 추천드립니다._

<br />

> 모든 디렉토리 패스는 프로젝트 루트를 기준으로 합니다.

### index.html 작성

- `template/index.html`
```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>test-ssr</title>
  </head>
  <body>
      <div id="root"></div>
  </body>
  </html>
```

### 컴포넌트 작성
예제에 사용될 컴포넌트들을 작성합니다.

- `src/Home.js`

    ```jsx
    import React from 'react';

    function Home() {
      return <div>
        <h3>This is home page</h3>
      </div>
    }

    export default Home;
    ```

- `src/About.js`

    ```jsx
    import React from 'react';

    function About() {
      return (
        <div>
          <h3>This is about page</h3>
        </div>
      )
    }

    export default About;
    ```

- `src/App.js`

    ```jsx
    import React, { useState, useEffect } from 'react';
    import Home from "./Home";
    import About from "./About";

    function App({ page: initialPage }) {
      const [page, setPage] = useState(initialPage);

      useEffect(() => {
        window.onpopstate = event => {
          setPage(event.state);
        }
      },[]);

      function onChangePage(e) {
        const newPage = e.target.dataset.page;
        window.history.pushState(newPage, '', `/${newPage}`);
        setPage(newPage);
      };

      const PageComponent = page === 'home' ? Home : About;

      return (
        <div>
          <button data-page="home" onClick={onChangePage}>
            Home
          </button>
          <button data-page="about" onClick={onChangePage}>
            About
          </button>
          <PageComponent />
        </div>
      )
    }

    export default App;
    ```

- `src/index.js`

    ```jsx
    import React from 'react';
    import ReactDom from 'react-dom';
    import App from "./App";

    ReactDom.render(<App page="home" />, document.getElementById('root'));
    ```

<br />
<br />

_아래 내용에 나오는 Webpack이나 Babel에 관한 내용은 [[환경설정] CRA환경 구현해보기](https://milban.dev/[%ED%99%98%EA%B2%BD%EC%84%A4%EC%A0%95]%20CRA%ED%99%98%EA%B2%BD%20%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0/)을 읽으시면 대부분 이해하실 수 있습니다._
### 바벨 설정

- `babel.config.js`

    ```js
    const presets = ['@babel/preset-react', '@babel/preset-env'];
    const plugins = [];
    module.exports = { presets, plugins };
    ```

### 웹팩 설정

- `webpack.config.js`

    ```js
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
            use: 'babel-loader',
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: "./template/index.html"
        })
      ],
      mode: "production",
      devServer: {
        historyApiFallback: true,
      }
    }
    ```
  
* [historyApiFallback](https://webpack.js.org/configuration/dev-server/#devserverhistoryapifallback) <br />
컴포넌트 구현에서 쓰인 [HTML5 history API](https://developer.mozilla.org/en-US/docs/Web/API/History)을 사용하기 위한 설정입니다.


### 실행 확인

- 실행 명령어

    ```bash
    webpack serve
    ```

## 마무리
이번 편에서는 프로젝트 시작 및 CSR 구현을 하였습니다.
다음 편에서는 SSR용 서버를 구현하고 `Hydration`에 대해서 알아보겠습니다.

## 깃허브 저장소

- [https://github.com/milban/react-ssr-example](https://github.com/milban/react-ssr-example)

## 출처
- [실전 리액트 프로그래밍 (이재승 저)](https://medium.com/@ljs0705/%EC%8B%A4%EC%A0%84-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B0%9C%EC%A0%95%ED%8C%90-%EC%86%8C%EC%8B%9D-d6d7a77e1c52)