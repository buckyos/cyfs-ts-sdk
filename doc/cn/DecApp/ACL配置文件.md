
## acl.cfg配置说明
这个文件用来配置app想要申请的权限，该文件会在app安装时，被app-manager读取，按照配置的各项值，向系统注册对应的权限

文件为toml格式，本质是以下的map:
```javascript
Map<string, AclConfig>

interface AclConfig {
    access?: HashMap<string, AccessString>,
    specified?: HashMap<string, SpecifiedGroup>
    config?: HashMap<string, string>,
}

interface SpecifiedGroup {
    access: string,
    zone?: ObjectId,
    dec_id?: Objectid,
    zone_category?: DeviceZoneCategory
}
```
### 顶层DecId
顶层map的key，为需要申请权限的dec id，特殊key "self"，代表自己的dec id。

### 为什么要申请权限
如果是同Zone内，同Dec之间的root-state读写，add-handler和post_object，是不需要配置任何额外的权限的。

如果有跨Zone，或者跨Dec的需求，就需要明确的配置权限：
- 对root-state的操作：根据读/写需求，配置r或w权限
- add-handler：如果要跨Zone，或者跨Dec的add-handler，需要给add-handler的虚路径配置对应的写权限
- post_object：如果要跨Zone，或者跨Dec去post_object，接收方必须给这个虚路径配置执行权限，即x权限

### 申请自己的路径权限
如果是自己给自己开放权限，可以在这个配置文件里标明，也可以在代码里动态注册。官方推荐在配置文件里一并写好的方式，避免后期维护困难

### 申请其他App给自己开放权限
如果是想要请求其他app开放权限给自己，那么必须在这个配置文件里写明，并让app-manager在安装时注册。无法在代码中动态注册

申请其他app的权限时，必须使用specified字段。access字段内的任何内容会被忽略。SpecifiedGroup的具体说明见下



### AclConfig
AclConfig中，各项参数的说明：
- access：完整权限配置，key为路径，可以是root-state的实路径，也可以是注册handler，和post_object时用的虚路径。AccessString为完整权限说明
- specified: 独立权限配置，key为路径，可以是实路径或虚路径。SpecifiedGroup为独立的权限配置
- config: 其他配置，目前为空

### SpecifiedGroup
表示某个具体的dec, zone，或zone_category的权限，与AccessString的不同在于，AccessString只能为每个组配置权限，SpecifiedGroup可以将权限限定到一个具体的DecId或ZoneId内

参数说明：
- access: 权限配置，为一个3位的"rwx-"的字符串
- zone：表示这个权限要被应用到哪个Zone上，这里一般填写Zone的PeopleId即可。也可以填写一个DeviceId，表示限定到某个特定的Device。不填表示任意设备
- zone_category: 表示这个权限要被应用到哪组zone上，不填表示任意设备
- dec_id：表示这个权限应用到哪个dec上，不填表示所有dec

当权限判定时，zone，zone_category，dec_id三组条件都必须同时满足，该权限才会被通过

```rust
pub enum DeviceZoneCategory {
    CurrentDevice = "current-device",
    CurrentZone = "current-zone",
    FriendZone = "friend-zone",
    OtherZone = "other-zone",
}
```

### AccessString：
我们用AccessString表示一个路径对应的完整权限，参考linux下的文件系统权限，以3位表示一组特定权限，一共6组18位表示一个完整权限。
#### 权限bits
目前权限分为Read/Write/Call三种
```rust
pub enum AccessPermission {
    Call = 0b001,
    Write = 0b010,
    Read = 0b100,
}
pub enum AccessPermissions {
    None = 0,
    CallOnly = 0b001,
    WriteOnly = 0b010,
    WriteAndCall = 0b011,
    ReadOnly = 0b100,
    ReadAndCall = 0b101,
    ReadAndWrite = 0b110,
    Full = 0b111,
}
```

#### 权限分组
目前根据device和dec，从左到右分为六个组：
```rust
pub enum AccessGroup {
    CurrentDevice = 0,
    CurrentZone = 3,
    FriendZone = 6,
    OthersZone = 9,

    OwnerDec = 12,
    OthersDec = 15,
}
```

#### 配置方法
目前，有两种方法在配置文件中表示一个AccessString：
1. 完整的字符串，用一个18位字符串来表示一个完整权限，组内用linux的"rwx-"，表示每一位的权限。组和组之间可以用空格，或下划线分隔
   > 例：给CurrentDevice，CurrentZone的OwnerDec完整权限，给FriendZone的OwnerDec读写权限，给OthersZone的OthersDec读权限：
   > 表示上述权限的字符串为"rwxrwxrw-r--rwxr--", 它和"rwx rwx rw- r-- rwx r--", 还有"rwx_rwx_rw-_r--_rwx_r--"是等价的
2. 以默认权限为基础，单独为某几组标注权限: 表示为一个数组，数组内是{group, access}，group为AccessGroup的枚举名，access为三位的"rwx-"字符串
   > 默认的AccessString权限："rwxrwxrwx---rwx"
   > 还是以上述的权限为例，表示为`[{group = "FriendZone", access = "rw-"}, {group = "OthersZone", access = "r--"}, {group = "OthersDec", access = "r--"}]`

### 一个完整的acl.toml实例
```toml
[self]

[self.access]   // 配置自己三个路径的权限
// /test3 使用单独表示法配置权限
"/test3" = [{group = "OthersDec", access = "-wx"}, {group = "CurrentDevice", access = "---"}]
// 下边两个路径使用完整的字符串表示法配置权限
"/test2" = "rwxrwxrwx---rwx---"
"/test1" = "rwxrwxrwx---rwx--x"

[self.specified]    // 自己开放权限给其他的dec
"/test3" = {access = "--x", dec_id = "9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4"}    // 开放/test3的call权限给特定的dec
"/test2" = {access = "--x", zone_category = "current-zone", dec_id = "9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4"} // 开放/test2的call权限给特定的dec，并且只能是当前zone内调用
// 开放/test1的call权限，给特定zone内所有的dec
"/test1" = {access = "--x", zone = "5aSixgLwnWbmcDKwBtTBd7p9U4bmqwNU2C6h6SCvfMMh"}

// 为自己申请DECID_A的权限
[DECID_A.specified]
// 下边的SpecifiedGroup配置，不允许填写dec_id，这里的dec_id限定为自己。填写dec_id字段会导致当条配置无效
"/test3" = {access = "--x"} // 为自己申请特定dec的/test3 call权限
"/test2" = {access = "--x", zone_category = "current-zone"} // 为自己申请特定dec的/test2 call权限，只允许本zone内调用
"/test1" = {access = "--x", zone = "5aSixgLwnWbmcDKwBtTBd7p9U4bmqwNU2C6h6SCvfMMh"}// 为自己申请特定dec的/test2 call权限，只允许特定的zone发起调用

[DECID_A.config]    //由于目前config字段为空，这个配置段写不写都可以
```