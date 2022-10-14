
## acl.cfg configuration description
This file is used to configure the permissions that the app wants to request. The file will be read by the app-manager when the app is installed, and the corresponding permissions will be registered with the system according to the configured values

The file is in toml format, and the essence is the following map:
```typescript
Map<string, AclConfig>

interface AclConfig {
    access?: Map<string, AccessString>,
    specified?: Map<string, SpecifiedGroup>
    config?: Map<string, string>,
}

interface SpecifiedGroup {
    access: string,
    zone?: ObjectId,
    dec_id?: Objectid,
    zone_category?: DeviceZoneCategory
}
```
### Top-level DecId
The key of the top-level map, for the dec id that needs to apply for permission, and the special key "self", representing its own dec id.

### Why apply for permission
If there is root-state read/write, add-handler and post_object within the same Zone, between the same Dec, it is not necessary to configure any extra permission.

If there are cross-Zone, or cross-Dec needs, you need to explicitly configure permissions for.
- operation on root-state: configure r or w permissions according to read/write needs
- add-handler: If you want to add-handler across Zone, or across Dec, you need to configure the corresponding write permission to the virtual path of add-handler.
- post_object: If you want to post_object across Zone, or across Dec, the recipient must configure execute permissions for this virtual path, i.e. x permissions

### Apply your own path permissions
If you open permissions to yourself, you can mark in this configuration file, or you can register dynamically in the code. The official recommendation is to write it in the configuration file to avoid maintenance difficulties later

### Request other apps to open permissions for yourself
If you want to request other apps to open permissions to you, then you must write it in this configuration file and let app-manager register it during installation. Cannot be registered dynamically in the code

When requesting permissions from other apps, you must use the specified field. anything in the access field will be ignored. the specifiedGroup is described below



### AclConfig
In AclConfig, the description of each parameter.
- access: full permission configuration, key is the path, either the real path of the root-state, or the dummy path used when registering handlers, and post_object. accessString is the full permission description
- Specified: Independent permission configuration, key is the path, can be real path or virtual path. specifiedGroup is the independent permission configuration
- config: other configurations, currently empty

### SpecifiedGroup
SpecifiedGroup can restrict the permission to a specific DecId or ZoneId, unlike AccessString, which can only configure the permission for each group.

Parameters description.
- access: permission configuration, a 3-digit "rwx-" string
- zone: indicates the Zone to which the permission will be applied, generally fill in the Zone's PeopleId here. You can also fill in a DeviceId to restrict to a specific Device, and leave it blank to indicate any device.
- zone_category: Indicates the group of zone to which this permission is to be applied.
- dec_id: indicates to which dec this permission will be applied, unfilled indicates all dec

When the permission is determined, zone, zone_category and dec_id must all be satisfied at the same time for the permission to be passed

```rust
pub enum DeviceZoneCategory {
    CurrentDevice = "current-device",
    CurrentZone = "current-zone",
    FriendZone = "friend-zone",
    OtherZone = "other-zone",
}
```

### AccessString.
We use AccessString to represent a path corresponding to the full permission, refer to the file system permissions under linux, with 3 bits to represent a specific set of permissions, a total of 6 groups of 18 bits to represent a full permission.
#### Permissionsbits
The current permissions are divided into Read/Write/Call
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

#### Permission grouping
Currently there are six groups, from left to right, based on device and dec.
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

#### Configuration Methods
Currently, there are two ways to represent an AccessString in a configuration file.
1. a full string, with an 18-bit string to represent a full permission, with the linux "rwx-" within the group, for each bit of the permission. Groups and groups can be separated by spaces, or underscores
   > Example: OwnerDec full permission for CurrentDevice, CurrentZone, OwnerDec read/write permission for FriendZone, and OthersDec read permission for OthersZone.
   > The string for the above permission is "rwxrwxrw-r--rwxr--", which is equivalent to "rwx rwx rwx rw- r-- rwx r--", and "rwx_rwx_rw-_r--_rwx_r--". 2.
2. the default permissions are used as the basis, and the permissions are marked separately for certain groups: it is represented as an array with {group, access}, group is the enumeration name of AccessGroup, access is a three-digit "rwx-" string
   > Default AccessString permission: "rwxrwxrwx--rwx"
   > Still using the above permissions as an example, denoted as `[{group = "FriendZone", access = "rw-"}, {group = "OthersZone", access = "r--"}, {group = "OthersDec", access = "r--"}]`

### A complete acl.cfg example
```toml
[self]

[self.access] // Configure permissions for your own three paths
// /test3 Configure permissions using a separate representation
"/test3" = [{group = "OthersDec", access = "--wx"}, {group = "CurrentDevice", access = "---"}]
// The next two paths use the full string representation to configure permissions
"/test2" = "rwxrwxrwx--rwx--"
"/test1" = "rwxrwxrwx--rwx--x"

[self.specified] // open permissions to other dec's yourself
"/test3" = {access = "--x", dec_id = "9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4"} // Open /test3's call permissions to a specific dec
"/test2" = {access = "--x", zone_category = "current-zone", dec_id = "9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4"} // Open /test2's call privileges to a specific dec and can only be called from within the current zone
// open /test1 call permission to all decs in a specific zone
"/test1" = {access = "--x", zone = "5aSixgLwnWbmcDKwBtTBd7p9U4bmqwNU2C6h6SCvfMMh"}

// Request DECID_A permissions for yourself
[DECID_A.specified]
// The SpecifiedGroup configuration below does not allow filling in the dec_id, here the dec_id is limited to yourself. Filling in the dec_id field will cause the current configuration to be invalid
"/test3" = {access = "--x"} // Request /test3 call permission for yourself for a specific dec
"/test2" = {access = "--x", zone_category = "current-zone"} // request /test2 call permission for yourself for a specific dec, allowing calls only within this zone
"/test1" = {access = "--x", zone = "5aSixgLwnWbmcDKwBtTBd7p9U4bmqwNU2C6h6SCvfMMh"}// Apply the /test2 call permission for a specific dec for yourself, only allow calls initiated by a specific zone

[DECID_A.config] // Since the config field is currently empty, this configuration segment can be written or not
```