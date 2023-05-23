import { Area, Device, DeviceCategory, DeviceDecoder, DeviceId, Endpoint, ObjectId, PeopleId, PrivateKey, to_buf, UniqueId } from '../sdk';

export function test_body_ext() {
    const area = new Area(1, 2, 1, 0);
    const owner = ObjectId.from_str("5r4MYfFMLwNG8oaBA7tmssaV2Z94sVZUfKXejfC1RMjX").unwrap();
    const unique_id = UniqueId.create_with_hash(Uint8Array.from(Buffer.from("test_device")));

    const sn_list =
        [DeviceId.from_base_58("5aSixgMAjePp1j5M7ngnU6CN6Do2gitKirviqJswuGVM").unwrap()];

    const private_key = PrivateKey.generate_rsa(1024).unwrap();
    const public_key = private_key.public();

    const device = Device.create(
        owner,
        unique_id,
        [],
        sn_list,
        [],
        public_key,
        area,
        DeviceCategory.IOSMobile,
    );

    let buf = device.to_vec().unwrap();
    console.log("device without object_id: ", buf.toHex());

    {
        const device1 = new DeviceDecoder().from_raw(buf).unwrap();
        console.assert(!device1.body_expect().object_id(), "device body object id should be empty");
    }

    const device_with_body_object_id = device;
    device_with_body_object_id.body_expect().set_object_id(owner);

    buf = device_with_body_object_id.to_vec().unwrap();
    console.log("device with object_id: {}", buf.toHex());

    {
        const device1 = new DeviceDecoder().from_raw(buf).unwrap();
        console.assert(device1.body_expect().object_id()!.eq(owner), "device body object id should match");
    }
}

export function test_object_codec() {
    const sk = PrivateKey.generate_rsa(1024).unwrap();
    const public_key = sk.public();

    const ep = Endpoint.fromString("W4udp120.24.6.201:8060").unwrap();
    const endpoints = [];
    for (let i = 0; i < 10; ++i) {
        endpoints.push(ep);
    }

    const test_device_id = DeviceId.from_base_58("5aSixgPXvhR4puWzFCHqvUXrjFWjxbq4y3thJVgZg6ty").unwrap();
    const sn_list = [];
    for (let i = 0; i < 10; ++i) {
        sn_list.push(test_device_id);
    }

    const passive_pn_list = [];
    for (let i = 0; i < 10; ++i) {
        passive_pn_list.push(test_device_id);
    }

    const people_id = PeopleId.from_base_58("5r4MYfFFQetBPDyeuBuDxPT7zowk9497SbpMQsZK2G19").unwrap();
    const name = "ts_device";

    const area = new Area(0, 5, 0, 0);
    const unique_id = UniqueId.default();
    const device = Device.create(people_id.object_id,
        unique_id,
        endpoints,
        sn_list,
        passive_pn_list,
        public_key,
        area,
        DeviceCategory.AndroidMobile);
    const device_id = device.desc().calculate_id();
    console.info(`create device success: ${device_id}`);

    {
        const buf = new Uint8Array(10);
        const buf2 = buf.subarray(0, 5);
        buf2[0] = 100;
        console.info(buf);
        console.assert(buf[0] === 100);

        const buf3 = buf2.offset(5);
        console.info(buf3);

        const buf4 = new Uint8Array(buf.buffer, 0, 5);
        console.info(buf4.length);
        console.info(buf4);
        const buf5 = buf4.offset(5);
        console.info(buf5.length, buf5);

        const buf6 = buf5.subarray(0, 3);
        console.info(buf6.length, buf6);

    }
    {
        const buf = to_buf(device).unwrap();
        const decoder = new DeviceDecoder();
        const [device2, remain_buf] = decoder.raw_decode(buf).unwrap();
        console.assert(remain_buf.byteOffset === buf.length);
        const device_id2 = device2.desc().calculate_id();
        console.info(`decode device success: ${device_id2}`);
        console.assert(device_id.to_base_58() === device_id2.to_base_58());

        {
            const list = device2.body_expect().content().endpoints();
            console.info(list[0].toString() === ep.toString());
        }
        {
            const list = device2.body_expect().content().sn_list();
            console.info(list[0].to_base_58());
            console.info(list[5].to_base_58() === test_device_id.to_base_58());
        }
        {
            const list = device2.body_expect().content().passive_pn_list();
            console.info(list[0].to_base_58() === test_device_id.to_base_58());
        }
    }

    {
        const v = '00015a02002f242fed7c298648000000004a6dfec37f7553da1938a5960a6d78820e60dc128f91cf95f0326c0005000004010030818902818100aff07dd0e29ca8d85770a9c6a44e72eb57bcbeb68376715d2ec54742f806a4c119cf3122e257c6f6be06583ac21303aa0a6a7d30e26c4f0428be861364208cfd6f7f3d59edc919e2fe5d41476a579076a061711215b27def64f73185d63460dc16d96af3fe883e51e9462bfbc0a42d7c28747095e732180ed18a788c8a25bb91020301000100000000000000000000000000000000000000000000000000100000000000000000000000000000000000002f242fed7c2989000143020a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c90a074c7c1f781806c912204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e4129960472005667212204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e412996047200566721a204400000004afc0f511801fe0a3740d546d599a2a801a92e41299604720056672';
        const buf = Uint8Array.from(Buffer.from(v, 'hex'));
        const decoder = new DeviceDecoder();
        const [device2, remain_buf] = decoder.raw_decode(buf).unwrap();
        const device_id2 = device2.desc().calculate_id();
        console.info(`decode device success: ${device_id2}`);
        console.assert(device_id2.to_base_58(), '5aTH29AYyc9kUDPZukUTozFpsnHbesp21URuLwPaGQHi');
        {
            const list = device2.body_expect().content().endpoints();
            console.info(list[0].toString() === ep.toString());
        }
        {
            const list = device2.body_expect().content().sn_list();
            console.info(list[0].to_base_58() === test_device_id.to_base_58());
        }
        {
            const list = device2.body_expect().content().passive_pn_list();
            console.info(list[0].to_base_58() === test_device_id.to_base_58());
        }
    }
}