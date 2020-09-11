# RegEditHelper

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
```ts
helper.query('Test2020').one().then(r=>{
  console.log(r);
})
```


## API

- `RegeditHelper new(namespace)` to get a Instance of RegeditHelper

    `namespace`#`string`: the registry keyPath, the curd keyPath  will relative to it

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
     
- `boolean update(values, keyPath = '', type= RegeditHelper.REG_SZ)` to update value to the registry, its parameter the same to `insertValues`

- `this query(keyPath = '', type = '', rec = true)` to query values from the registry
       
     `keyPath`#`string`: the registry keyPath relative to its namespace, default `''`
     
     `type`#`string`: the registry type, default `REG_SZ`
     
     `rec`#`boolean`: is recursive query required, default `true`

- `Promise<object> origin()` get query origin results

- `Promise<object> values()` get query values results

- `Promise<object> one()`  only get the data of the keyPath, not include its children nodes     
     
