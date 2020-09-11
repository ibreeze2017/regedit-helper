import { exec } from 'child_process';
import * as iconv from 'iconv-lite';

interface MapType<T=any> {
  [index: string]: T;
}

interface Value {
  type: RegEditType;
  value: RegEditTypeMap[RegEditType];
}

interface ValueObject {
  [index: string]: Value;
}

interface RegistryRecord {
  rec: string;
  key: string;
  type: string;
  value: string;

}

interface QueryResultObject {
  type: string;
  data: RegistryRecord[];
  path: string;
  key: string;
}

interface RegEditTypeMap {
  /**
   * a string basically
   */
  REG_SZ: string;
  REG_EXPAND: string;
  /**
   * should use javascript numbers
   */
  REG_DWORD: number[];
  /**
   * an array of strings
   */
  REG_MULTI_SZ: string[];
  /**
   * an array of numbers (representing bytes)
   */
  REG_BINARY: number[];
  /**
   * When including a default value in a putValue operation, one must use the REG_DEFAULT type. Further more, the name of the value is insignificant since in the registry the default value has no name, but because of the way the node and the vb processes communicate a name must be used. Please note that the only legal value type of a default value is REG_SZ
   */
  REG_DEFAULT: any;
}

/**
 * Supported value types
 */
type RegEditType = keyof RegEditTypeMap;

const encoding = 'cp936';
const binaryEncoding: any = 'binary';

export default class RegeditHelper {

  public static REG_SZ = 'REG_SZ' as RegEditType;
  public static REG_EXPAND = 'REG_EXPAND' as RegEditType;
  public static REG_DWORD = 'REG_DWORD' as RegEditType;
  public static REG_MULTI_SZ = 'REG_MULTI_SZ' as RegEditType;
  public static REG_BINARY = 'REG_BINARY' as RegEditType;
  public static REG_DEFAULT = 'REG_DEFAULT' as RegEditType;
  public static mapping: MapType<string> = {
    HKLM: 'HKEY_LOCAL_MACHINE',
    HKCU: 'HKEY_CURRENT_USER',
    HKU: 'HKEY_USERS',
    HKCR: 'HKEY_CLASSES_ROOT',
    HKCC: 'HKEY_CURRENT_CONFIG',
  };
  public static NodeType = {
    SUB: 'sub',
    VALUE: 'value',
  };
  public static ROOT_KEY = '__ROOT';
  private readonly namespace: string;
  private result: Promise<QueryResultObject[]> | null = null;

  public static new(namespace: string) {
    return new RegeditHelper(namespace);
  }

  public static getKeyPath(...keys: string[]) {
    return keys.filter(Boolean).join('\\');
  }

  public static exec(shellCmdString: string) {
    return new Promise<string>((resolve, reject) => {
      exec(shellCmdString, (stderr: any, stdout) => {
        if (stderr) {
          stderr.origin = {
            message: iconv.decode(new Buffer(stderr.message, binaryEncoding), encoding),
            code: stderr.code,
            cmd: stderr.cmd,
          };
          reject(stderr);
          return;
        }
        resolve(stdout.replace(/\r*\n/g, '\r\n'));
      });
    });
  }

  public static isValidType(type: string) {
    return ([
      RegeditHelper.REG_SZ,
      RegeditHelper.REG_EXPAND,
      RegeditHelper.REG_DWORD,
      RegeditHelper.REG_MULTI_SZ,
      RegeditHelper.REG_BINARY,
      RegeditHelper.REG_DEFAULT,
    ] as string[]).indexOf(type.toUpperCase()) > -1;
  }

  public static toValues(o: QueryResultObject) {
    return !o ? {} : o.data.reduce<MapType<string>>((acc, c) => {
      if (c) {
        acc[c.key.trim()] = c.value;
      }
      return acc;
    }, {});
  }

  private static read(keyPath: string, type = '') {
    return RegeditHelper.exec([`reg query "${keyPath}"`, type ? `/t ${type}` : ''].join(' ')).catch(err => {
      err.message = `Failed to get value of ${RegeditHelper.getKeyPath(keyPath)}`;
      throw err;
    });
  }

  public static getFullKey(key: string) {
    return Object.keys(RegeditHelper.mapping).reduce((acc, k) => acc.replace(new RegExp(`^${k}`), RegeditHelper.mapping[k]), key);
  }

  public static async query(key: string, type = '', rec = false, maxDepth = -1) {
    const rs: QueryResultObject[] = [];
    const fullKey = RegeditHelper.getFullKey(key);

    async function loop(loopKey: string, rec = false, depth = 0) {
      const content = await RegeditHelper.read(loopKey, type);
      const r = t(content);
      for (const l of Object.keys(r)) {
        const dataList = r[l];
        if (l === loopKey) {
          rs.push({
            type: RegeditHelper.NodeType.VALUE,
            data: dataList,
            path: l,
            key: l.replace(fullKey, '').replace('\\', '') || RegeditHelper.ROOT_KEY,
          });
        } else {
          if (!dataList.length && rec && (depth < maxDepth || maxDepth === -1)) {
            await loop(l, rec, depth + 1);
          } else {
            rs.push({
              type: RegeditHelper.NodeType.SUB,
              data: [],
              path: l,
              key: l.replace(fullKey + '\\', ''),
            });
          }
        }
      }
      return rs;
    }

    function t(content: string) {
      let ck = '';
      const p = content.split('\r\n').filter(Boolean).reduce<MapType<string[]>>((acc, c) => {
        if (c.indexOf(fullKey) === 0) {
          acc[ck = c] = [];
          return acc;
        }
        if (c === ck) {
          return acc;
        }
        acc[ck].push(c);
        return acc;
      }, {});
      return Object.entries(p).map<[string, RegistryRecord[]]>(([k, v]) => [k, f(v)]).reduce<MapType<RegistryRecord[]>>((acc, [k, v]) => ({
        ...acc,
        [k]: v,
      }), {});
    }

    /**
     * parse query row
     * @param {string[]} data
     * @returns {RegistryRecord[]}
     */
    function f(data: string[]) {
      return data
        .map(i => i.trim().match(/(.+)(\s+REG\w+\s+)(.+)/)!).filter(Boolean).map<RegistryRecord>(([rec, key, type, value]) => ({
          rec,
          key,
          type,
          value,
        }));
    }

    return loop(fullKey, rec);
  }

  public static remove(keyPath: string, value = '') {
    return RegeditHelper.exec([`reg delete "${keyPath}"`, value !== '' ? `/v "${value}"` : '', '/f'].join(' ')).catch(err => {
      err.message = `Failed to delete value # ${RegeditHelper.getKeyPath(keyPath, value)}：${value}`;
      throw err;
    });
  }

  public static add(keyPath: string, key: string, value: string, type = RegeditHelper.REG_SZ) {
    return RegeditHelper.exec(`reg add "${keyPath}" /v "${key}" /t "${type}" /d "${value}" /f`).catch(err => {
      err.message = `Failed to add or update value ${[keyPath, key].join('\\')}：${value}`;
      throw err;
    });
  }

  public static insert(keyPath: string, valueObject: ValueObject) {
    return Promise.all(Object.entries(valueObject).map(([k, v]) => RegeditHelper.add(keyPath, k, v.value, v.type))).then(r => r.every(Boolean));
  }

  public static update(keyPath: string, valueObject: ValueObject) {
    return RegeditHelper.insert(keyPath, valueObject);
  }

  private constructor(namespace: string) {
    this.namespace = namespace;
  }

  public getKeyPath(keyPath = '') {
    return [this.namespace, keyPath].filter(Boolean).join('\\');
  }

  public insert(valueObject: ValueObject, keyPath = '') {
    return RegeditHelper.insert(this.getKeyPath(keyPath), valueObject);
  }

  public insertValues(values: MapType<string | number>, keyPath = '', type: RegEditType = RegeditHelper.REG_SZ) {
    return this.insert(Object.entries(values).reduce<ValueObject>((acc, [k, v]) => {
      if (RegeditHelper.isValidType(type)) {
        acc[k] = {
          type,
          value: v,
        };
      }
      return acc;
    }, {}), keyPath);
  }

  public update(values: MapType<string | number>, keyPath = '', type: RegEditType = RegeditHelper.REG_SZ) {
    return this.insertValues(values, keyPath, type);
  }

  public query(keyPath = '', type = '', rec = true) {
    this.result = RegeditHelper.query(this.getKeyPath(keyPath), type, rec);
    return this;
  }

  public async values() {
    return !this.result ? [] : (await this.result).filter(i => i.type === RegeditHelper.NodeType.VALUE).reduce<MapType<MapType<string>>>((acc, c) => {
      acc[c.key] = RegeditHelper.toValues(c);
      return acc;
    }, {});
  }

  public async simple() {
    return !this.result ? [] : (await this.result).reduce<MapType<MapType<string>>>((acc, c) => {
      acc[c.key] = RegeditHelper.toValues(c);
      return acc;
    }, {});
  }

  public async one() {
    return this.result ? RegeditHelper.toValues(((await this.result).filter(i => i.key === RegeditHelper.ROOT_KEY)[0])) : {};
  }

  public origin() {
    return this.result;
  }

  public getNamespace() {
    return this.namespace;
  }

  public remove(keys: string | string[] = []) {
    const removeKeys = typeof keys === 'string' ? [keys] : keys;
    return Promise.all((removeKeys.length ? removeKeys : ['']).map(k => this.getKeyPath(k)).map(k => RegeditHelper.remove(k))).then(r => r.every(Boolean));
  }

  public release() {
    this.result = null;
  }
}

