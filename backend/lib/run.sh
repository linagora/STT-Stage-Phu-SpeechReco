for x in nnet_a_gpu_online/conf/*conf; do
  cp $x $x.orig
  sed s:/export/a09/dpovey/kaldi-clean/egs/fisher_english/s5/exp/nnet2_online/:$(pwd)/: < $x.orig > $x
done

$1/src/online2bin/online2-wav-nnet2-latgen-faster --do-endpointing=false \
--online=false \
--config=nnet_a_gpu_online/conf/online_nnet2_decoding.conf \
--max-active=7000 --beam=15.0 --lattice-beam=6.0 \
--acoustic-scale=0.1 --word-symbol-table=graph/words.txt \
nnet_a_gpu_online/smbr_epoch2.mdl graph/HCLG.fst "ark:echo $2 $2|" "scp:echo $2 $2|" \
ark:/dev/null