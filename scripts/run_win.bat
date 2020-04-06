SET CURRENTDIR="%cd%"
docker run --network host -v %CURRENTDIR%:/unbound/app -w /unbound/app -it unboundcasp/centos7:2001 %1 %2 %3 %4
