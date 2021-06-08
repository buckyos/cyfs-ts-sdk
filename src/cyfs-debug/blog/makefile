define __pre
	node pre.js -input $(1)

endef

define __post
	node pre.js -input $(1) -r
    
endef


###需要预处理的目录
complie_files := $(shell find ./src -name '*.js')


all: pre blog post

pre:
	@node pre_cluster.js $(complie_files)

post:
	@node pre_cluster.js -r $(complie_files)
	
blog:
	gcc -Wno-invalid-pp-token -E -P -D_NODEJS -D_BUCKYJS ./src/blog.js.c > ./node_blog.js
	node post.js ./node_blog.js
	cp ./node_blog.js ./blog.js
	gcc -Wno-invalid-pp-token -E -P -D_H5JS ./src/blog.js.c > ./h5_blog.js
	node post.js ./h5_blog.js
	gcc -Wno-invalid-pp-token -E -P -D_RNJS ./src/blog.js.c > ./rn_blog.js
	node post.js ./rn_blog.js
    

clean:
	rm -f ./node_blog.js
	rm -f ./h5_blog.js
	rm -f ./rn_blog.js




