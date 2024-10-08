import { NodeIQQNTWrapperSession } from './wrapper';
import { randomUUID } from 'crypto';

interface Internal_MapKey {
  timeout: number,
  createtime: number,
  func: (...arg: any[]) => any,
  checker: ((...args: any[]) => boolean) | undefined,
}

export class ListenerClassBase {
  [key: string]: string;
}

export interface ListenerIBase {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new(listener: any): ListenerClassBase;
}

export class NTEventWrapper {

  private ListenerMap: { [key: string]: ListenerIBase } | undefined;//ListenerName-Unique -> Listener构造函数
  private WrapperSession: NodeIQQNTWrapperSession | undefined;//WrapperSession
  private ListenerManger: Map<string, ListenerClassBase> = new Map<string, ListenerClassBase>(); //ListenerName-Unique -> Listener实例
  private EventTask = new Map<string, Map<string, Map<string, Internal_MapKey>>>();//tasks ListenerMainName -> ListenerSubName-> uuid -> {timeout,createtime,func}
  constructor() {

  }
  createProxyDispatch(ListenerMainName: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const current = this;
    return new Proxy({}, {
      get(target: any, prop: any, receiver: any) {
        // console.log('get', prop, typeof target[prop]);
        if (typeof target[prop] === 'undefined') {
          // 如果方法不存在，返回一个函数，这个函数调用existentMethod
          return (...args: any[]) => {
            current.DispatcherListener.apply(current, [ListenerMainName, prop, ...args]).then();
          };
        }
        // 如果方法存在，正常返回
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  init({ ListenerMap, WrapperSession }: { ListenerMap: { [key: string]: typeof ListenerClassBase }, WrapperSession: NodeIQQNTWrapperSession }) {
    this.ListenerMap = ListenerMap;
    this.WrapperSession = WrapperSession;
  }
  CreatEventFunction<T extends (...args: any) => any>(eventName: string): T | undefined {
    const eventNameArr = eventName.split('/');
    type eventType = {
      [key: string]: () => { [key: string]: (...params: Parameters<T>) => Promise<ReturnType<T>> }
    }
    if (eventNameArr.length > 1) {
      const serviceName = 'get' + eventNameArr[0].replace('NodeIKernel', '');
      const eventName = eventNameArr[1];
      //getNodeIKernelGroupListener,GroupService
      //console.log('2', eventName);
      const services = (this.WrapperSession as unknown as eventType)[serviceName]();
      let event = services[eventName];
      //重新绑定this
      event = event.bind(services);
      if (event) {
        return event as T;
      }
      return undefined;
    }

  }
  CreatListenerFunction<T>(listenerMainName: string, uniqueCode: string = ''): T {
    const ListenerType = this.ListenerMap![listenerMainName];
    let Listener = this.ListenerManger.get(listenerMainName + uniqueCode);
    if (!Listener && ListenerType) {
      Listener = new ListenerType(this.createProxyDispatch(listenerMainName));
      const ServiceSubName = listenerMainName.match(/^NodeIKernel(.*?)Listener$/)![1];
      const Service = 'NodeIKernel' + ServiceSubName + 'Service/addKernel' + ServiceSubName + 'Listener';
      const addfunc = this.CreatEventFunction<(listener: T) => number>(Service);
      addfunc!(Listener as T);
      //console.log(addfunc!(Listener as T));
      this.ListenerManger.set(listenerMainName + uniqueCode, Listener);
    }
    return Listener as T;
  }
  //统一回调清理事件
  async DispatcherListener(ListenerMainName: string, ListenerSubName: string, ...args: any[]) {
    //console.log(ListenerMainName, this.EventTask.get(ListenerMainName), ListenerSubName, this.EventTask.get(ListenerMainName)?.get(ListenerSubName));
    this.EventTask.get(ListenerMainName)?.get(ListenerSubName)?.forEach((task, uuid) => {
      //console.log(task.func, uuid, task.createtime, task.timeout);
      if (task.createtime + task.timeout < Date.now()) {
        this.EventTask.get(ListenerMainName)?.get(ListenerSubName)?.delete(uuid);
        return;
      }
      if (task.checker && task.checker(...args)) {
        task.func(...args);
      }
    });
  }
  async CallNoListenerEvent<EventType extends (...args: any[]) => Promise<any>,>(EventName = '', timeout: number = 3000, ...args: Parameters<EventType>) {
    return new Promise<Awaited<ReturnType<EventType>>>(async (resolve, reject) => {
      const EventFunc = this.CreatEventFunction<EventType>(EventName);
      let complete = false;
      const Timeouter = setTimeout(() => {
        if (!complete) {
          reject(new Error('NTEvent EventName:' + EventName + ' timeout'));
        }
      }, timeout);
      const retData = await EventFunc!(...args);
      complete = true;
      resolve(retData);
    });
  }
  async CallNormalEvent<EventType extends (...args: any[]) => Promise<any>, ListenerType extends (...args: any[]) => void>
    (EventName = '', ListenerName = '', waitTimes = 1, timeout: number = 3000, checker: (...args: Parameters<ListenerType>) => boolean, ...args: Parameters<EventType>) {
    return new Promise<[EventRet: Awaited<ReturnType<EventType>>, ...Parameters<ListenerType>]>(async (resolve, reject) => {
      const id = randomUUID();
      let complete = 0;
      let retData: Parameters<ListenerType> | undefined = undefined;
      let retEvent: any = {};
      const databack = () => {
        if (complete == 0) {
          reject(new Error('NTEvent EventName:' + EventName + ' ListenerName:' + ListenerName + ' timeout'));
        } else {
          resolve([retEvent as Awaited<ReturnType<EventType>>, ...retData!]);
        }
      };
      const Timeouter = setTimeout(databack, timeout);

      const ListenerNameList = ListenerName.split('/');
      const ListenerMainName = ListenerNameList[0];
      const ListenerSubName = ListenerNameList[1];
      const eventCallbak = {
        timeout: timeout,
        createtime: Date.now(),
        checker: checker,
        func: (...args: any[]) => {
          complete++;
          //console.log('func', ...args);
          retData = args as Parameters<ListenerType>;
          if (complete >= waitTimes) {
            clearTimeout(Timeouter);
            databack();
          }
        }
      };
      if (!this.EventTask.get(ListenerMainName)) {
        this.EventTask.set(ListenerMainName, new Map());
      }
      if (!(this.EventTask.get(ListenerMainName)?.get(ListenerSubName))) {
        this.EventTask.get(ListenerMainName)?.set(ListenerSubName, new Map());
      }
      this.EventTask.get(ListenerMainName)?.get(ListenerSubName)?.set(id, eventCallbak);
      this.CreatListenerFunction(ListenerMainName);
      const EventFunc = this.CreatEventFunction<EventType>(EventName);
      //console.log("测试打点", args);
      retEvent = await EventFunc!(...(args as any[]));
    });
  }
}