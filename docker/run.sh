#!/bin/bash
python ./backend/lib/kaldi-trunk/kaldi-gstreamer-server/kaldigstserver/master_server.py --port=8888 &
cd ./backend/lib/kaldi-trunk/kaldi-gstreamer-server
python ./kaldigstserver/worker.py -u ws://localhost:8888/worker/ws/speech -c ./sample_english_nnet2.yaml &
cd -
grunt dev --allow-root
