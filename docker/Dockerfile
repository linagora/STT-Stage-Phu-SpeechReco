FROM nvidia/cuda:7.0-cudnn4-runtime
ENV install_dir /root/SpeechReco

# Install dependencies

RUN apt update
RUN apt install -y git vim nodejs maven npm python-setuptools openjdk-7-jdk automake autoconf wget libtool subversion libatlas-base-dev python-pip python-gi libgstreamer1.0-dev gstreamer1.0-plugins-good gstreamer1.0-tools gstreamer1.0-pulseaudio libjansson-dev curl 
RUN apt install -y cuda || true # we have some nonblocking errors here

RUN ln -s /usr/bin/nodejs /usr/bin/node && ln -s -f /bin/bash /bin/sh

RUN npm install -g npm@latest grunt-cli bower && easy_install https://github.com/google/closure-linter/zipball/master

# Clone required repositories

WORKDIR /root
RUN git clone --quiet --depth 1 https://github.com/linagora/STT-Stage-Phu-SpeechReco.git SpeechReco
WORKDIR ${install_dir}/backend/lib
RUN git clone --quiet --depth 1 https://github.com/kaldi-asr/kaldi.git kaldi-trunk --origin golden
WORKDIR ${install_dir}/backend/lib/kaldi-trunk/
RUN git clone --quiet --depth 1 https://github.com/alumae/kaldi-gstreamer-server.git
RUN git clone --quiet --depth 1 https://github.com/alumae/gst-kaldi-nnet2-online.git

# Install SpeechReco deps

WORKDIR ${install_dir}

RUN npm install --no-optional && bower install --allow-root && mvn assembly:assembly -DdescriptorId=jar-with-dependencies

RUN mv ${install_dir}/backend/lib/index.js ${install_dir}/node_modules/google-speech-api/index.js

# Compile Kaldi deps

WORKDIR ${install_dir}/backend/lib
RUN ./get_data.sh ./kaldi-trunk

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/tools/
RUN extras/check_dependencies.sh && make

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/src
RUN ./configure --shared --cudatk-dir=/usr/local/cuda && make ext

RUN pip install ws4py==0.3.2 tornado pyyaml

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/src/online2bin/
RUN make

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/src/gst-plugin
RUN make depend && make

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/gst-kaldi-nnet2-online/src
ENV KALDI_ROOT=${install_dir}/backend/lib/kaldi-trunk
RUN make depend && make

WORKDIR ${install_dir}/backend/lib/kaldi-trunk/kaldi-gstreamer-server
RUN /bin/bash test/models/download-tedlium-nnet2.sh
RUN mv english/* test/models/english/ && rmdir english

ENV GST_PLUGIN_PATH=${install_dir}/backend/lib/kaldi-trunk/gst-kaldi-nnet2-online

# All set, ready to go

ADD run.sh ${install_dir}/run.sh
WORKDIR ${install_dir}/

CMD /bin/bash ./run.sh
