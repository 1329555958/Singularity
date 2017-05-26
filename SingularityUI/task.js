/**
 * 用来获取任务数据
 * Created by weichunhe on 2017/5/26.
 */
var HttpClient = function () {
    this.get = function (aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    }
};
var _client = new HttpClient();
function getTag(filter) {
    var filter = filter;
    if (!filter) {
        console.log('请在搜索框中输入环境信息，比如func112,然后开始拉取tag!');
        return;
    }
    filter = filter.trim();
    console.log('开始拉取' + filter + '的tag');
    _client.get("/singularity/api/requests", function (requests) {
        requests = JSON.parse(requests);
        var length = 0;
        for (var i = 0; i < requests.length; i++) {
            if (requests[i].request.id.startsWith(filter)) {
                length++;
            }
        }
        _client.get("/singularity/api/tasks/active", function (tasks) {
            tasks = JSON.parse(tasks);
            var env = null;
            var tags = {};
            for (var i = 0; i < tasks.length; i++) {
                env = tasks[i].taskRequest.deploy.env;
                if (env.ENV_INFO.startsWith(filter)) {
                    tags[env.INSTANCE_NAME] = env.INSTANCE_CMD;
                }
            }
            var tagArr = [];

            for (var d in tags) {
                tagArr.push(d + ":" + tags[d]);
            }
            console.log(tagArr.join("\r\n"), '\r\n共' + tagArr.length + '个tag!');
            if (length !== tagArr.length) {
                console.error("共" + length + '个应用，但是共' + tagArr.length + '个tag,请确认!')
            }
        });
    });
}


