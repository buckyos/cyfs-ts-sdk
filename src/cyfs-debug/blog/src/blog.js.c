
#ifdef _NODEJS
const os = require('os');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra');
#endif

#include "./blog_define.js"
#include "./global.js"

#ifdef _NODEJS
#include "./blog_node_env.js"
const BLogEnv = new BLogNodeEnv();
#endif

#ifdef _WXJS
#include "./blog_stack_helper.js"
#include "./blog_wx_env.js"
const BLogEnv = new BLogWXEnv();
#endif

#ifdef _H5JS
#include "./blog_stack_helper.js"
#include "./blog_h5_env.js"
const BLogEnv = new BLogH5Env();
#endif

#ifdef _RNJS
#include "./blog_stack_helper.js"
#include "./blog_rn_env.js"
const BLogEnv = new BLogRNEnv();
#endif

#include "./linked_list.js"
#include "./blog_console_target.js"
#include "./blog_cache.js"

#ifdef _NODEJS
#include "./blog_file_target.js"
#include "./blog_tcp_target.js"
#endif

#if  defined(_WXJS) || defined(_H5JS) || defined(_RNJS)
#include "./blog_storage_target.js"
#endif

#ifdef _WXJS
//#include "./blog_wx_uploader.js"
#endif

#ifdef _H5JS
//#include "./blog_h5_uploader.js"
#endif

#include "./blog_option.js"

#ifdef _BUCKYJS
#include "./blog_config.js"
#endif // _BUCKYJS

#include "./blog.js"

#include "./callchain.js"

#include "./blog_exports.js"
