../../src/online2bin/online2-wav-nnet2-latgen-faster --do-endpointing=false \
--online=false \
--config=nnet_a_gpu_online/conf/online_nnet2_decoding.conf \
--max-active=7000 --beam=15.0 --lattice-beam=6.0 \
--acoustic-scale=0.1 --word-symbol-table=graph/words.txt \
nnet_a_gpu_online/smbr_epoch2.mdl graph/HCLG.fst "ark,t:utt.txt" "scp,t:audio_utt.txt" \
'ark:|../../src/latbin/lattice-best-path --acoustic-scale=0.1 ark,t:- ark,t:- | ../fisher_english/s5/utils/int2sym.pl -f 2- graph/words.txt > output.txt' 
