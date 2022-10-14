## CYFS TOOL Meta Commands
CYFS Tool supports a series of commands that manipulate the meta chain

### Query transaction results
Each write operation to the chain returns a transaction ID, and this command queries the transaction on the chain
`cyfs meta receipt <TxId>`
If the command returns an error, the transaction is not yet on the chain

If the command returns something like `get receipt {TxId} on height {height}, ret {ret}`, then the transaction has been executed and is on the chain
> - TxId: the same as the input TxId
> - height: the block height of the transaction
> - ret: indicates the result of the execution of this transaction. 0 means success, non-zero value means execution failed
### putdesc up
`cyfs meta putdesc [-d <desc_file>] -c <caller> [-u] <price> [coin_id]`
-d, --desc: path of the desc file to be uploaded, if not, the default is the caller's desc
-c, --caller: path to caller's desc/sec file pair, do not enter suffix.
-u: force update desc body modification time to current time
- price: the rent of the desc on the chain, currently it can be 0
- coin_id: coin_id of the desc rent, currently must be 0
### Transfer
`cyfs meta transfer -f <from> -t <to> <amount> [coin_id]`
-f, --from: path to the desc/sec file pair of the source account for the transfer, no suffix is entered.
-t, --to: the ObjectId of the account to which the transfer is to be made; if this ObjectId has a chain name bound to it, you can also enter the chain name
- amount: the amount to be transferred in Qiu, 1 Qiu = 10^-8 DMC
- coid_id: coin_id, in case of DMC transfer this value is 0, by default this value is 0
### Withdrawals from other accounts
You can only withdraw from an account where you are the Owner
`cyfs meta withdraw -c <caller> <account> <balance> [coinid]`
-c, --caller: path to caller's desc/sec file pair, do not enter suffix.
- account: the ObjectId of the account to be withdrawn, you can also enter the chain name if this ObjectId is tied to a chain name
- balance: the amount to be withdrawn, in Qiu, 1 Qiu = 10^-8 DMC
- coid_id: coin_id, the value is 0 in case of DMC withdrawal, the default value is 0
### Buy name
`cyfs meta bidname -c <caller> [-o <owner_id>] <name> [bid_price] [rent]`
-c, --caller: path to caller's desc/sec file pair, no suffix entered.
-o, --owner: id of the owner, defaults to caller id
- name: the name of the chain to buy
- bid_price: the amount to bid, currently can be 0
- rent: the name rent, can be 0 at the moment
### Configure name links
`cyfs meta namelink -c <caller> <name> -t <obj_type> <obj>`
-c, --caller: path to caller's desc/sec file pair, no suffix entered.
- name: the purchased name of the chain
-t: type of binding, currently "obj", "name", "ip" are available
- obj: The value to bind. When the binding type is obj, the value is an ObjectiId, and when the binding type is name, the value is a self owned, purchased another name. Binding type ip is not currently supported
### Query name information
`cyfs meta getname <name>`
Get name information
### Query account balance
`cyfs meta getbalance <account> [coinid]`
- account: the account ID, or the chain name if the ID is bound to a chain name
- coinid: default is 0