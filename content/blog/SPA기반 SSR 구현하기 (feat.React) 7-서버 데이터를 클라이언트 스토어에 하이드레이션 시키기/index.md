---
date: '2021-01-07T00:07'
title: 'SPA기반 SSR 구현하기 (feat.React) 7-서버 데이터를 클라이언트 스토어에 하이드레이션 시키기'
---

이 전편에서 api서버에서 페치된 데이터를 클라이언트 사이드로 전달하였습니다. 하지만 아직 해당 데이터를 클라이언트 사이드에서 사용하고 있지 않습니다.
해당 데이터를 클라이언트 사이드에서 사용하기 위해서 우리가 만들어둔 `PreloadContext` 스토어에 `Hydration`시키는 방법을 알아보고 구현하겠습니다.

### 패키지 설치

```bash
npm i -D core-js@3
```

* `core-js@3` <br/>
  폴리필을 채우기 위해 `babel`과 함께 사용되는 패키지입니다. 클라이언트 사이드에서 `Promise` 사용에 필요합니다.

### 환경설정

- 바벨 - `.babelrc.client.js`

    ```jsx
    const config = require('./.babelrc.common.js');
    config.presets.push([
      '@babel/preset-env',
      {
        'useBuiltIns': 'usage',
        'corejs': {
          "version": 3
        },
      }
    ]);
    module.exports = config;
    ```


### 클라이언트 사이드 스토어 생성

- `src/index.js`

    ```jsx
    import React from 'react';
    import ReactDom from 'react-dom';
    import App from "./App";
    import {BrowserRouter} from "react-router-dom";
    import PreloadContext from "./lib/PreloadContext";

    const initialData = window.__INITIAL_DATA__;
    ReactDom.hydrate(
      <BrowserRouter>
        <PreloadContext.Provider value={initialData} > // (1)
          <App />
        </PreloadContext.Provider>
      </BrowserRouter>,
      document.getElementById('root')
    );
    ```
  
* (1) 컴포넌트에 서버로부터의 데이터를 사용할 수 있도록 `PreloadContext` 스토어를 사용하여 서버 데이터를 컴포넌트에 제공합니다. 

### 클라이언트 사이드 데이터 로딩을 위한 코드 작성

- `src/About.js`

    ```jsx
    import React, { useEffect, useState, useContext } from 'react';
    import axios from "axios";
    import PreloadContext from "./lib/PreloadContext";

    function About() {
      const preloadedData = useContext(PreloadContext);
      const [data, setData] = useState(
        preloadedData
        && preloadedData.data.find(item => item.routeKey === 'about')
        && preloadedData.data.find(item => item.routeKey === 'about').props.data
      );
      useEffect(() => {
        if(data) {
          return;
        }
        const fetch = async () => {
          const res = await axios.get('https://hacker-news.firebaseio.com/v0/item/8863.json');
          setData(res.data);
        }
        fetch();
      },[]); // (1)
      return (
        <div>
          <h1>{data && data.title}</h1>
          <h3>This is about page</h3>
        </div>
      )
    }

    About.serverFetch = async () => {
      const res = await axios.get('https://hacker-news.firebaseio.com/v0/item/8863.json');
      return {
        routeKey: 'about',
        props: {
          data: res.data,
        }
      }
    }

    export default About;
    ```

* (1) `data`가 존재하지 않을 시, 데이터 페치를 실행합니다. CSR을 통해 해당 컴포넌트가 렌더링 됐을 경우의 로직입니다.

### 실행 확인

```bash
  npm run build
  npm start
```

## 마무리
이제 모든 구현 단계가 끝났습니다. 이로 인해 우리는 다음과 같은 주요 기능들이 동작하는 SSR 앱을 만들었습니다.
1. 스타일이 적용된 HTML파일을 응답합니다.
2. 서버 사이드에서 api서버로부터 데이터를 페치해 해당 데이터가 담긴 HTML을 응답합니다.
3. 서버로부터 응답된 HTML파일을 React가 `Hydration` 합니다.
4. 서버로부터 받은 api서버 데이터를 클라이언트 스토어가 `Hydration` 합니다.


이제 우리는 `1-개념편`의 첫 부분에서 말한 것처럼 SPA기반 SSR 앱의 개념, 동작 원리, 구현 방법등을 어느정도 알게되었습니다.


짧지 않은 시리즈물을 끝까지 봐주셔서 감사합니다.
