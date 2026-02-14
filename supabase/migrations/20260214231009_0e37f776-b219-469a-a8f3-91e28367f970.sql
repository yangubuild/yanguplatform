
ALTER TABLE public.credit_transactions
  DROP CONSTRAINT credit_transactions_transaction_type_check;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['spend', 'add', 'refund', 'bonus', 'grant', 'reserve', 'charge']));
