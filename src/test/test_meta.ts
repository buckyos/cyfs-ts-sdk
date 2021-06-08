import { create_meta_client } from '../cyfs-meta';

export async function test_meta() {
    const meta_client = create_meta_client();
    const ret = await meta_client.getBalance(0, '5bnZVFXPS2kxKYj6YvmPbXitZyvJVhjeN1YYr7wHTTk5');
    console.info(ret);
}