# WebRTC从入门到跑路
* 最近一直在弄ros小车，希望实现在4、5G网络下远端控制功能，同时传输音视频，抖音上其实有不少类似的项目了，不过不自己弄一下永远不理解其中的奥秘。在此希望能帮助小白轻松上手，也为自己做下技术储备。

## 参考文献
[http://www.vue5.com/webrtc/webrtc.html](http://www.vue5.com/webrtc/webrtc.html)

## 公共服务端
* 官方镜像地址[https://registry.hub.docker.com/r/coturn/coturn](https://registry.hub.docker.com/r/coturn/coturn)
```shell
# 拉取镜像
docker pull coturn/coturn

# 这里采用host方式，服务器也一定要配置防火墙端口
# 3478/tcp 3478/udp
# 5349/tcp 5349/udp
# 49152-65535/tcp 49152-65535/udp
sudo docker run -d --restart=always --network=host coturn/coturn
```

## 程序运行
* vscode采用“Live Server”插件，用于启动文件夹内的网页
* 使用node环境，运行“server.js”信令服务器，使用命令如下
```shell
# 因为没有package.json所以node_module会安装到用户目录下
npm install ws

# 运行，注意路径匹配
node server.js
```
