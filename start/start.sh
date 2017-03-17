#! /bin/bash
kill -9 `cat singularity.pid |awk '{print $1}'`
nohup java -jar ../SingularityService/SingularityService-0.14.0-*.jar server ../SingularityService/singularity_config.yaml >singularity.log 2>&1 &
echo $!>singularity.pid
tail -f singularity.log
