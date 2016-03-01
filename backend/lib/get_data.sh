mkdir $1/egs/online-nnet2
cd $1/egs/online-nnet2
wget http://kaldi-asr.org/downloads/build/5/trunk/egs/fisher_english/s5/exp/nnet2_online/nnet_a_gpu_online/archive.tar.gz -O nnet_a_gpu_online.tar.gz
wget http://kaldi-asr.org/downloads/build/2/sandbox/online/egs/fisher_english/s5/exp/tri5a/graph/archive.tar.gz -O graph.tar.gz
mkdir -p nnet_a_gpu_online graph
tar zxvf nnet_a_gpu_online.tar.gz -C nnet_a_gpu_online
tar zxvf graph.tar.gz -C graph
