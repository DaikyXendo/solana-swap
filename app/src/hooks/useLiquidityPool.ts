import { useEffect, useState } from 'react';
import { useAnchorProgram } from './useAnchorProgram';
import { PublicKey } from '@solana/web3.js';
import { MINT_TOKEN_ADDRESS, MOCK_POOL } from '../constants';
import { Program, utils } from '@coral-xyz/anchor';
import { BasicLiquidityPool } from '../models';
import { TokenProgramService } from '../services/token-program.service';

async function findPoolLiquidityAddress(program: Program<any>, poolAddress: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
        [utils.bytes.utf8.encode('POOL_LIQUIDITY'), poolAddress.toBuffer()],
        program.programId
    );
}

export type ExtendedBasicLP = Record<keyof BasicLiquidityPool | 'amount' | 'ata' | 'authority', any>;

export const useLiquidityPool = () => {
    const { anchorProgram: program, connection } = useAnchorProgram();
    const [pool, setPool] = useState<ExtendedBasicLP | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const init = async () => {
            if (program) {
                setLoading(true);
                const mockPoolAddress = MOCK_POOL;
                const fetchedPool: ExtendedBasicLP | undefined = (await program?.account.basicLiquidityPool.fetch(
                    mockPoolAddress
                )) as any;
                if (fetchedPool) {
                    const [poolAuthority] = await findPoolLiquidityAddress(program, mockPoolAddress);
                    const poolTokenAddress = await TokenProgramService.findAssociatedTokenAddress(
                        poolAuthority,
                        MINT_TOKEN_ADDRESS
                    );
                    const balance = await connection.getTokenAccountBalance(poolTokenAddress);

                    fetchedPool.authority = poolAuthority;
                    fetchedPool.amount = balance;
                    fetchedPool.ata = poolTokenAddress;
                    setPool(fetchedPool);
                    setLoading(false);
                }
            }
        };
        init();
    }, [program]);

    return {
        pool,
        loading,
    };
};
