if [[ -z "$BLOCK_TIME" ]]; then
    BLOCK_TIME_PARAM=""
else
    BLOCK_TIME_PARAM="-b $BLOCK_TIME"
fi

anvil --state ./chaindata --chain-id 5 $BLOCK_TIME_PARAM
