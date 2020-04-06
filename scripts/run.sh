docker run --network host -v $(pwd):/unbound/app -w /unbound/app -it unboundcasp/centos7:2001 ${@:1}
