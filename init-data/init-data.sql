INSERT INTO "User" ("id", "telegramId", "username", "allowAcceleratedSign", "isDisabled", "createdAt")
VALUES ('99e2375c-0f4b-4ab6-9d29-90e97931fb21', '1355216586', 'alice', true, false, CURRENT_TIMESTAMP);

INSERT INTO "Wallet" ("id", "userId", "stakeId", "hashedKey", "createdAt")
VALUES ('ac3c39c2-dadf-40f4-b368-bb9be61e9815', '99e2375c-0f4b-4ab6-9d29-90e97931fb21', 'stake_test1uzh8s4xc4srsa74ry8wwe7ty9wm5pv3jlfnf6n3raj24amc8qp5zn', 'hashed_key', CURRENT_TIMESTAMP);

INSERT INTO "Address" ("id", "walletId", "address", "createdAt")
VALUES ('f1c0b8a4-2d3e-4b5c-9f7d-6a2e5f3b8c1e', 'ac3c39c2-dadf-40f4-b368-bb9be61e9815', 'addr_test1qqqt3gvv7pu3ntw3zpnwzfjl7hctdj3flzgjfzx033dd5h9w0p2d3tq8pma2xgwuanukg2ahgzer97nxn48z8my4tmhszqulj3', CURRENT_TIMESTAMP);

INSERT INTO "Token" ("id", "policyId", "tokenHexName", "tokenName", "isValidated", "isDisabled")
VALUES
    ('09b277fa-2ffa-4039-9a80-b51924e3fd83', '', '', 'ADA', true, false),
    ('1b7e6c09-cd27-4d12-8145-1829c9d841f3', 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72', '4d494e', 'MIN', false, false);

INSERT INTO "TokenPair" (id, "tokenAId", "tokenBId", "isMainPair", sequence)
VALUES
    ('5C835F43-D737-45C9-BF90-BA8BC8E4715D', '09b277fa-2ffa-4039-9a80-b51924e3fd83', '1b7e6c09-cd27-4d12-8145-1829c9d841f3', true, 1), --ADA/MIN (order by pool asset)
    ('E7AE6266-5DA3-46A0-814C-3AAA881969C9', '1b7e6c09-cd27-4d12-8145-1829c9d841f3', '09b277fa-2ffa-4039-9a80-b51924e3fd83', false, 2); --MIN/ADA