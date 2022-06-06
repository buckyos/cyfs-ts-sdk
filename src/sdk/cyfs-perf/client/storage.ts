
  const local = {
    get(name: string) {
      return localStorage.getItem(name);
    },
    set(name: string, value: string) {
      localStorage.setItem(name, value);
    },
  };


// 包装的 localStorage & sessionStorage 方便调用
export  function  getData(name: string) {
  return local.get(name);
}

export  function setData(name: string, value: string, isSession: any) {
  local.set(name, value);
}

export function remove(name: string) {
  localStorage.removeItem(name);
}
