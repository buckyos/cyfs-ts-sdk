// 简单的双向链表
class LinkedListItem {
    constructor(data, pre, next) {
        this.m_data = data;
        this.m_pre = pre;
        this.m_next = next;
    }
}

class LinkedList {
    constructor() {
        this.m_head = null;
        this.m_tail = null;
        this.m_current = null;
        this.m_length = 0;
        this.m_forward = false;
    }

    size() {
        return this.m_length;
    }

    count() {
        return this.m_length;
    }

    empty() {
        return this.m_length === 0;
    }

    back() {
        if (this.m_length === 0) {
            return;
        } else {
            return this.m_tail.m_data;
        }
    }

    front() {
        if (this.m_length === 0) {
            return;
        } else {
            return this.m_head.m_data;
        }
    }

    push_back(data) {
        let item = new LinkedListItem(data, this.m_tail, null);

        if (this.m_length > 0) {
            this.m_tail.m_next = item;
            this.m_tail = item;
        } else {
            this.m_head = item;
            this.m_tail = item;
        }

        ++this.m_length;

        return item;
    }

    pop_back() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }

        assert(this.m_tail);
        let item = this.m_tail;
        --this.m_length;


        if (this.m_length > 0) {
            this.m_tail = item.m_pre;
            this.m_tail.m_next = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }

        if (this.m_current === item) {
            this._correct_current();
        }

        return item.m_data;
    }

    push_front(data) {
        let item = new LinkedListItem(data, null, this.m_head);
        if (this.m_length > 0) {
            this.m_head.m_pre = item;
            this.m_head = item;
        } else {
            this.m_tail = item;
            this.m_head = item;
        }

        ++this.m_length;

        return item;
    }

    pop_front() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }

        assert(this.m_head);
        let item = this.m_head;
        --this.m_length;


        if (this.m_length > 0) {
            this.m_head = item.m_next;
            this.m_head.m_pre = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }

        if (this.m_current === item) {
            this._correct_current();
        }

        return item.m_data;
    }

    current() {
        if (this.m_current) {
            return this.m_current.m_data;
        } else {
            return;
        }
    }

    current_iterator() {
        return this.m_current;
    }
    
    // private
    _correct_current() {
        if (this.m_current) {
            let item = this.m_current;

            if (this.m_forward) {
                this.m_current = item.m_pre;
            } else {
                this.m_current = item.m_next;
            }
        }
    }

    // 查找并删除data
    delete(data) {
        let iterator = this.m_head;
        while (iterator) {
            if (data === iterator.m_data) {
                this.erase(iterator);
                return true;
            }

            iterator = iterator.m_next;
        }

        return false;
    }

    erase(iterator) {
        if (iterator === this.m_head) {
            this.pop_front();
        } else if (iterator === this.m_tail) {
            this.pop_back();
        } else {
            --this.m_length;

            let item = iterator;

            if (iterator === this.m_current) {
                this._correct_current();
            }

            assert(item.m_pre);
            assert(item.m_next);

            item.m_pre.m_next = item.m_next;
            item.m_next.m_pre = item.m_pre;
        }
    }

    reset() {
        this.m_current = null;
    }

    next() {
        this.m_forward = true;

        if (this.m_current) {
            this.m_current = this.m_current.m_next;
        } else {
            this.m_current = this.m_head;
        }

        if (this.m_current) {
            return true;
        } else {
            return false;
        }
    }

    prev() {
        this.m_forward = false;

        if (this.m_current) {
            this.m_current = this.m_current.m_pre;
        } else {
            this.m_current = this.m_tail;
        }

        if (this.m_current) {
            return true;
        } else {
            return false;
        }
    }

    // 支持for...of遍历
    [Symbol.iterator]() {
        return {
            iterator: this.m_head,
            self: this,
            next() {
                if (this.iterator) {
                    const ret = { value: this.iterator.m_data, done: false };
                    this.iterator = this.iterator.m_next;
                    return ret;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }

    clear() {
        let iterator = this.m_head;
        while (iterator) {
            delete iterator.m_data;
            iterator = iterator.m_next;
        }

        this.m_head = null;
        this.m_tail = null;
        this.m_current = null;
        this.m_length = 0;
    }

    // 检查指定元素是否存在
    exists(data) {
        let iterator = this.m_head;
        while (iterator) {
            if (data === iterator.m_data) {
                return true;
            }

            iterator = iterator.m_next;
        }

        return false;
    }
}
