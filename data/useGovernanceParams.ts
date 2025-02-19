import { useQuery } from '@tanstack/vue-query';
import { useConfig } from '@/composables';
import { TokenAmount } from '@/domain';

export type GovernanceDepositParams = {
  minDeposit: TokenAmount;
  maxDepositPeriod: string;
};

export const useGovernanceParams = async (): Promise<{
  params: Ref<GovernanceDepositParams | undefined>;
  loading: Ref<boolean>;
}> => {
  const { data, isLoading } = useQuery({
    queryKey: [{ scope: 'governance', entity: 'params' }],
    queryFn: async () => {
      const { restEndpoint, tokenDenom } = useConfig();

      return await $fetch<any>(`${restEndpoint}/cosmos/gov/v1beta1/params/deposit`).then(data => {
        return {
          minDeposit: TokenAmount.makeFromAmount(data?.deposit_params?.min_deposit?.[0]?.amount || 0, tokenDenom),
          maxDepositPeriod: data?.deposit_params?.max_deposit_period || '0s',
        } as GovernanceDepositParams;
      });
    },
    staleTime: 1000 * 60 * 60, // cache for 60 minutes
  });

  return {
    params: data,
    loading: isLoading,
  };
};
