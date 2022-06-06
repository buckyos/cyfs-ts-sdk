class Base<T> {
    private m_obj_type: number;
    private m_builder: new (...constructorArgs: any[]) => T;

    constructor(obj_builder: new (...constructorArgs: any[]) => T) {
        this.m_obj_type = Base.get_obj_type();
        this.m_builder = obj_builder;
    }

    static get_obj_type(): number {
        console.info(typeof (this as any)['obj_type']);
        return (this as any)['obj_type'];
    }

    static default() {
        console.info(this.get_obj_type());
    }
}

class De extends Base<De> {
    static obj_type: number = 0;
    constructor() {
        super(De);
    }
}

class De2 extends Base<De> {
    static obj_type: number = 1;
    constructor() {
        super(De);
    }
}

function test_derive() {
    De.default();
    De2.default();
    De.default();
}