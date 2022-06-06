# js-conditional-compile-loader

- [English](https://github.com/hzsrc/js-conditional-compile-loader/blob/master/readme.md)

一个javascript条件编译的webpack loader。   
条件编译，是指 用同一套代码和同样的编译构建过程，根据设置的条件，选择性地编译指定的代码，从而输出不同程序的过程。  
比如：用一套代码实现debug和release环境输出两套不同js程序。

### 用法
插件提供了`IFDEBUG`和`IFTRUE`两个条件编译指令。用法是：在js代码的任意地方以`/*IFDEBUG`或`/*IFTRUE_xxx`开头，以`FIDEBUG*/`或`FITRUE_xxx*/`结尾，中间是被包裹的js代码。`xxx`是在webpack中指定的options条件属性名，比如`myFlag`。

- 模式1 - 全注释:   
因为采用了js注释的形式，故即使不使用js-conditional-compile-loader，也不影响js代码的运行逻辑。
````js
    /*IFDEBUG Any js here FIDEBUG*/
````

````js
/* IFTRUE_yourFlagName ...js code... FITRUE_yourFlagName */
````
- 模式2（首+尾）：   
这种模式下，可使用eslint校验你的代码。
````js
/* IFDEBUG */
var anyJsHere = 'Any js here'
/*FIDEBUG */
````

````js
/* IFTRUE_yourFlagName*/ 
function anyJsHere(){
}
/*FITRUE_yourFlagName */
````

----
### 由源码输出的结果
源码：
````js
/* IFTRUE_forAlibaba */
var aliCode = require('./ali/alibaba-business.js')
aliCode.doSomething()
/* FITRUE_forAlibaba */

$state.go('win', {dir: menu.winId /*IFDEBUG , reload: true FIDEBUG*/})
````
当options为`{isDebug: true, forAlibaba: true}`时，构建后输出的内容:
````js
var aliCode = require('./ali/alibaba-business.js')
aliCode.doSomething()

$state.go('win', {dir: menu.winId, reload: true })
````

当options为`{isDebug: false, forAlibaba: false}`时，构建后输出的内容:
````js
$state.go('win', {dir: menu.winId})
````
----


### 安装
````bash
    npm i -D js-conditional-compile-loader
````

### webpack配置
这样修改webpack配置:     
查看样例： [vue-element-ui-scaffold-webpack4](https://github.com/hzsrc/vue-element-ui-scaffold-webpack4)
`js-conditional-compile-loader`需要作为处理js文件的第一步。

````js
module: {
    rules: [
        {
            test: /\.js$/,
            include: [resolve('src'), resolve('test')],
            use: [
                //step-2
                'babel-loader?cacheDirectory',
                //step-1
                {
                    loader: 'js-conditional-compile-loader',
                    options: {
                        isDebug: process.env.NODE_ENV === 'development', // optional, this is default
                        myFlag: process.env.ENV_COMPANY === 'ALI', // any name, used for /* IFTRUE_myFlag ...js code... FITRUE_myFlag */
                    }
                },
            ]
        },
        //other rules
    ]
}
````
### options
- isDebug: {bool = [process.env.NODE_ENV === 'development']}

如果isDebug === false，所有`/\*IFDEBUG` 和 `FIDEBUG\*/`之间的代码都会被移除。 其他情况，这些代码则会被保留。

- 任意属性名：{bool}
如果 value === false，所有`/\* IFTRUE_属性名` 和 `FITRUE_属性名 \*/`之间的代码都会被移除。 其他情况，这些代码则会被保留。

	
## 用法举例

* 1:
````js
var tx = "This is app /* IFTRUE_Ali of debug FITRUE_Ali */ here";
````

* 2:
````js
/*IFDEBUG
alert('Hi~');
FIDEBUG*/
````

* 3
```js
Vue.component('debugInfo', {
    template: ''
    /* IFDEBUG
        + '<pre style="font-size:13px;font-family:\'Courier\',\'Courier New\';z-index:9999;line-height: 1.1;position: fixed;top:0;right:0; pointer-events: none">{{JSON.stringify($attrs.info || "", null, 4).replace(/"(\\w+)":/g, "$1:")}}</pre>'
    FIDEBUG */
    ,
    watch: {
      /* IFTRUE_myFlag */
      curRule (v){
          this.ruleData = v
      },
      /*FITRUE_myFlag */
    },
});
```

* 4
```javascript
import { Layout } from 'my-layout-component'
var LayoutRun = Layout
/* IFDEBUG
  import FpLayoutLocal from '../../local-code/my-layout-component/src/components/layout.vue'
  LayoutRun = FpLayoutLocal
FIDEBUG */

export default {
    components: {
      LayoutRun
    },
}
```
