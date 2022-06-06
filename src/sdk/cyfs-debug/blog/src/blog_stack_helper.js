const BLOG_STACK_EXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
const BLOG_LINE_EXP = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;

class BLogStackHelper {

    static _extractLocation(urlLike) {
        // Fail-fast but return locations like '(native)'
        if (urlLike.indexOf(':') === -1) {
            return [urlLike];
        }

        const parts = BLOG_LINE_EXP.exec(urlLike.replace(/[\(\)]/g, ''));
        return [parts[1], parts[2] || undefined, parts[3] || undefined];
    }

    static _parseStackString(stackString) {
        const filtered = stackString.split('\n').filter((line) => {
            return !!line.match(BLOG_STACK_EXP);
        });

        return filtered.map((line) => {
            if (line.indexOf('(eval ') > -1) {
                // Throw away eval information until we implement stacktrace.js/stackframe#8
                line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
            }
            const tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
            const locationParts = BLogStackHelper._extractLocation(tokens.pop());
            const functionName = tokens.join(' ') || undefined;
            const fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];

            return ({
                functionName: functionName,
                fileName: fileName,
                lineNumber: locationParts[1],
                columnNumber: locationParts[2],
                source: line
            });
        });
    }

    static _getStackString(info) {
        let stack;
        try {
            throw new Error(info);
        } catch (e) {
            stack = e.stack;
        }

        return stack;
    }

    static baseName(path) {
        return path.split(/[\\/]/).pop();
    }
    /*
        info = {
            frame : [integer],
            pos : [boolean],
            stack : [boolean],
        }*/
    static getStack(info) {
        const stackString = BLogStackHelper._getStackString('prepare stack');
        
        const stack = BLogStackHelper._parseStackString(stackString);
        if (info.pos) {
            const frameIndex = info.frame + 3;
            info.pos = null;
            if (stack && stack.length > 0 && frameIndex < stack.length) {
                const frame = stack[frameIndex];
                info.pos = {
                    'line': frame.lineNumber,
                    'file': frame.fileName,
                    'func': frame.functionName,
                };

                if (info.pos.file && !info.fullpath) {
                    info.pos.file = BLogStackHelper.baseName(info.pos.file);
                }
            }
        }

        if (info.stack) {
            if (stack && stack.length > 0) {
                info.stack = '';
                for (let index = info.frame + 3; index < stack.length; ++index) {
                    const frame = stack[index];
                    info.stack += `at ${frame.functionName} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber})\n`;
                }
            } else {
                info.stack = stackString;
            }
        }
    }
}
