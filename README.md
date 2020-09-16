# RegEditHelper

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![licenses][licenses]][licenses-url]
[![PR's welcome][prs]][prs-url]

A simple tool to help handle the registry
 
## Example 

```ts
const RegistryHelper = require('regedit-helper').default;
const helper = RegistryHelper.new('HKCU\\Software\\HMS')
helper.query('Test2020').values().then(r=>{
  console.log(r);
})
```
here's the result:
```json
{ 
  "Test2020": { 
     "name": "admin",
     "age" : "22"
  }
}

```

## API


- static `RegeditHelper new(namespace)` get a Instance of RegeditHelper

    `namespace`#`string`: the registry keyPath, the curd keyPath  will relative to it
    
- static `boolean create(keyPath)` create a registry key path if not exists

    `keyPath`#`string`: the registry full keyPath

- `boolean insert(valueObject, keyPath = '')` to insert value to the registry
    
    `values`#`object`: a simple js object, and it contains object types, which contains properties `type`,`value`

      const valueObject = {
        name:{
            type:'REG_SZ',
            value:'admin'
        }
      }

    `keyPath`#`string`: the registry keyPath relative to its namespace

- `boolean insertValues(values, keyPath = '', type = RegeditHelper.REG_SZ)`   to insert value to the registry
      
     `values`#`object`: a simple js object, and it contains only primitive types
     
        const values = {
             name: 'REG_SZ',
             age: 22,
        }
     
     `keyPath`#`string`: the registry keyPath relative to its namespace
     
     `type`#`string`: the registry type, default `REG_SZ`
     
- `boolean update(values, keyPath = '', type= RegeditHelper.REG_SZ)` update value to the registry, its parameter the same to `insertValues`

- `boolean remove(keys: string | string[] = [], values: string | string[] = [])` remove the registry key 
    
     `keyPath`#`string|string[]`: the registry keyPath relative to its namespace, default `[]`  
      
     `values`#`string|string[]`: the registry leaf keys, default `[]`
      
      When only the first parameter is passed, the current key and all its child node key values will be removed. The second parameter is used to control the specific attribute key value of the current node    

- `this query(keyPath = '', type = '', rec = true)` query values from the registry
       
     `keyPath`#`string`: the registry keyPath relative to its namespace, default `''`
     
     `type`#`string`: the registry type, default `REG_SZ`
     
     `rec`#`boolean`: is recursive query required, default `true`

- `Promise<object> origin()` get query origin results

- `Promise<object> values()` get query values results

- `Promise<object> one()`  only get the data of the keyPath, not include its children nodes     
     


[npm]: https://img.shields.io/npm/v/webpack.svg
[npm-url]: https://npmjs.com/package/webpack
[node]: https://img.shields.io/node/v/webpack.svg
[node-url]: https://nodejs.org
[deps]: https://img.shields.io/david/webpack/webpack.svg
[deps-url]: https://david-dm.org/webpack/webpack
[tests]: https://img.shields.io/travis/webpack/webpack/master.svg
[tests-url]: https://travis-ci.org/webpack/webpack
[prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[prs-url]: https://webpack.js.org/contribute/
[builds-url]: https://ci.appveyor.com/project/sokra/webpack/branch/master
[builds]: https://ci.appveyor.com/api/projects/status/github/webpack/webpack?svg=true
[builds2]: https://dev.azure.com/webpack/webpack/_apis/build/status/webpack.webpack
[builds2-url]: https://dev.azure.com/webpack/webpack/_build/latest?definitionId=3
[licenses-url]: https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fwebpack%2Fwebpack?ref=badge_shield
[licenses]: https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fwebpack%2Fwebpack.svg?type=shield
[cover]: https://img.shields.io/coveralls/webpack/webpack.svg
[cover-url]: https://coveralls.io/r/webpack/webpack/
