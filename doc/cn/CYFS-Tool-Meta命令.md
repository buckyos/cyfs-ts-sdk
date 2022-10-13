## CYFS TOOL Meta命令
CYFS Tool 支持一系列的命令，这些命令可以操作meta链

### 查询交易结果
每一个对链的写操作，都会返回一个交易ID，此命令可以查询交易在链上的情况
`cyfs meta receipt <TxId>`
如果该命令报错，说明这个交易还没有上链

如果该命令返回类似`get receipt {TxId} on height {height}, ret {ret}`的返回，说明这个交易已经执行并上链
> - TxId: 和输入的TxId相同
> - height：表示这个交易的块高度
> - ret：表示这个交易的执行结果。0表示成功，非0值表示执行失败
### 将desc上链
`cyfs meta putdesc [-d <desc_file>] -c <caller> [-u] <price> [coin_id]`
- -d, --desc: 要上传的desc文件路径，如果不传，默认为caller的desc
- -c, --caller: caller的desc/sec文件对路径，不输入后缀。
- -u: 强制更新desc body的修改时间为当前时间
- price: 链上desc的租金，当前可以为0
- coin_id：desc租金的coin_id，当前必须为0
### 转账
`cyfs meta transfer -f <from> -t <to> <amount> [coin_id]`
- -f, --from：转账源账户的desc/sec文件对路径，不输入后缀。
- -t, --to: 转账到账户的ObjectId。如果这个ObjectId有绑定过链上名字，也可以输入链上名字
- amount: 要转账的金额，单位为Qiu, 1 Qiu = 10^-8 DMC
- coid_id: coin_id，转账DMC的情况下该值为0，默认该值为0
### 从其他账户提现
只能从自己为Owner的账户上提现
`cyfs meta withdraw -c <caller> <account> <balance> [coinid]`
- -c, --caller: caller的desc/sec文件对路径，不输入后缀。
- account：要提现的账户ObjectId。如果这个ObjectId有绑定过链上名字，也可以输入链上名字
- balance：要提现的金额，单位为Qiu, 1 Qiu = 10^-8 DMC
- coid_id: coin_id，提现DMC的情况下该值为0，默认该值为0
### 购买名字
`cyfs meta bidname -c <caller> [-o <owner_id>] <name> [bid_price] [rent]`
- -c, --caller: caller的desc/sec文件对路径，不输入后缀。
- -o, --owner: owner的id，默认为caller id
- name: 要购买的链上名字
- bid_price: 出价金额，当前可为0
- rent：名字租金，当前可为0
### 配置名字链接
`cyfs meta namelink -c <caller> <name> -t <obj_type> <obj>`
- -c, --caller: caller的desc/sec文件对路径，不输入后缀。
- name: 已购买的链上名字
- -t: 绑定类型，目前可选"obj", "name", "ip"
- obj: 要绑定的值。当绑定类型为obj时，该值为一个ObjectiId。当绑定类型为name时，该值为一个自己所有的，已购买的另一个名字。当前不支持绑定类型ip
### 查询名字信息
`cyfs meta getname <name>`
获取名字信息
### 查询账户余额
`cyfs meta getbalance <account> [coinid]`
- account： 账户ID，如果这个Id有绑定过链上名字，也可以输入链上名字
- coinid: 默认为0