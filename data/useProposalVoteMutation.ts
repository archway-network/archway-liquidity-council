import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useContracts } from '@/composables';
import { Transactions } from '@/domain';
import { useWalletStore, useTransactionsStore } from '@/store';

import { AccountConfig, ProposalId, ProposalVoteOption } from '@/types';

export const useProposalVoteMutation = async (accountId: AccountConfig.AccountId, walletAddress: ComputedRef<string | undefined>) => {
  const walletStore = useWalletStore();
  const transactionsStore = useTransactionsStore();
  const { proposalsContractAddress } = useContracts(accountId);

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: ProposalId; vote: ProposalVoteOption }) => {
      if (!walletAddress.value) return;

      const transactions = Transactions.make(walletStore?.signingClient as SigningArchwayClient);
      return transactions.execute(proposalsContractAddress.value, walletAddress.value, {
        vote: {
          proposal_id: proposalId,
          vote,
        },
      });
    },

    onMutate: async () => {
      transactionsStore.onStart();
    },

    onSuccess: (result, { proposalId }) => {
      queryClient.invalidateQueries({
        queryKey: [{ scope: 'accounts', entity: `account.${accountId}.proposals`, accountId, address: walletAddress }],
      });

      queryClient.invalidateQueries({
        queryKey: [
          {
            scope: 'accounts',
            entity: `account.${accountId}.proposals.${proposalId}.votes`,
            accountId,
            proposalId,
            address: walletAddress,
          },
        ],
      });

      transactionsStore.onSuccess(result?.transactionHash);
    },

    onError: async (error: Error) => {
      transactionsStore.onError(error);
    },
  });

  return { mutate, loading: isLoading };
};
