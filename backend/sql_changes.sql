-- 16012021

-- Dumping structure for function betting.fn_update_balance_on_result
DROP FUNCTION IF EXISTS `fn_update_balance_on_result`;
DELIMITER //
CREATE FUNCTION `fn_update_balance_on_result`(
	`pBetResultId` INT,
	`pIsFancy` tinyint(4),
	`pIsRollback` tinyint(4),
	`pIsSuperAdminCommission` CHAR(1),
	`pSuperAdminCommissionType` INT
) RETURNS tinyint
    NO SQL
    COMMENT 'Update user and all upper level user balance accordingly on declare or rollback result'
BEGIN

  IF(pIsSuperAdminCommission = '1' AND pSuperAdminCommissionType != 0) THEN
    UPDATE users AS u SET u.total_super_admin_commission = u.total_super_admin_commission + IFNULL((SELECT IFNULL((CASE WHEN (pIsRollback = 1) THEN -SUM(a.super_admin_commission) ELSE SUM(a.super_admin_commission) END), 0) FROM user_profit_loss a WHERE bet_result_id = pBetResultId), 0) WHERE u.user_type_id = 1 ;
  END IF;

  IF(pIsFancy = 1) THEN

    UPDATE user_profit_loss a 
    INNER JOIN users b ON (b.id = a.user_id) 
    INNER JOIN fancy_score_position c ON (c.user_id= a.user_id AND c.match_id = a.match_id AND a.market_id = c.fancy_id AND a.type = '2') 
    SET b.balance = 
      CASE WHEN (pIsRollback = 1) THEN 
        CASE WHEN (a.user_pl < 0) THEN
          b.balance - a.user_commission -a.user_pl + c.liability - a.super_admin_commission_user_part
        ELSE
          b.balance - a.user_pl - a.user_commission + c.liability - a.super_admin_commission_user_part 
        END
      ELSE 
        CASE WHEN (a.user_pl < 0) THEN
          b.balance + a.user_commission +a.user_pl - c.liability + a.super_admin_commission_user_part
        ELSE
          b.balance + a.user_pl + a.user_commission - c.liability + a.super_admin_commission_user_part
        END
      END, 
    b.liability = 
      CASE WHEN (pIsRollback = 1) THEN 
        b.liability + c.liability
      ELSE
        b.liability - c.liability
      END,
    b.profit_loss = CASE WHEN (pIsRollback = 1) THEN b.profit_loss - a.user_pl - a.user_commission ELSE b.profit_loss + a.user_pl + a.user_commission END
    WHERE a.bet_result_id = pBetResultId AND b.user_type_id = 5;

    UPDATE user_profit_loss a 
    INNER JOIN users b ON (b.id = a.user_id) 
    INNER JOIN fancy_score_position c ON (c.user_id= a.user_id AND c.match_id = a.match_id AND a.market_id = c.fancy_id AND a.type = '2') 
    SET b.total_balance = b.balance - b.liability
    WHERE a.bet_result_id = pBetResultId AND b.user_type_id = 5;

  ELSE

    UPDATE user_profit_loss a 
    INNER JOIN users b ON (b.id = a.user_id) 
    SET b.balance = CASE WHEN (pIsRollback = 1) THEN b.balance - a.user_pl - a.user_commission - a.super_admin_commission_user_part ELSE b.balance + a.user_pl + a.user_commission + a.super_admin_commission_user_part END, 
    b.total_balance = CASE WHEN (pIsRollback = 1) THEN b.total_balance - a.user_pl - a.user_commission - a.super_admin_commission_user_part ELSE b.total_balance + a.user_pl + a.user_commission + a.super_admin_commission_user_part END, 
    b.profit_loss = CASE WHEN (pIsRollback = 1) THEN b.profit_loss - a.user_pl - a.user_commission - a.super_admin_commission_user_part ELSE b.profit_loss + a.user_pl + a.user_commission + a.super_admin_commission_user_part END
    WHERE a.bet_result_id = pBetResultId AND b.user_type_id = 5;

  END IF;

  UPDATE (SELECT c.agent_id AS user_id, SUM(c.agent_pl + c.agent_commission + c.super_admin_commission_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.balance = (CASE WHEN (pIsRollback = 1) THEN (b.balance - a.pl) ELSE (b.balance + a.pl) END)
  WHERE b.user_type_id = 4;

  UPDATE (SELECT c.agent_id AS user_id, SUM(c.agent_pl + c.agent_commission + c.super_admin_commission_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0))
  WHERE b.user_type_id = 4;

  UPDATE (SELECT c.agent_id AS user_id, SUM(c.agent_pl + c.agent_commission + c.super_admin_commission_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET 
  b.profit_loss = (b.total_balance - b.freechips)
  WHERE b.user_type_id = 4;

  UPDATE (SELECT c.super_agent_id AS user_id, SUM(c.super_agent_pl + c.super_agent_commission + c.super_admin_commission_super_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.super_agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.balance = (CASE WHEN (pIsRollback = 1) THEN (b.balance - a.pl) ELSE (b.balance + a.pl) END)
  WHERE b.user_type_id = 3;

  UPDATE (SELECT c.super_agent_id AS user_id, SUM(c.super_agent_pl + c.super_agent_commission + c.super_admin_commission_super_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.super_agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0))
  WHERE b.user_type_id = 3;

  UPDATE (SELECT c.super_agent_id AS user_id, SUM(c.super_agent_pl + c.super_agent_commission + c.super_admin_commission_super_agent_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.super_agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.profit_loss = (b.total_balance - b.freechips)
  WHERE b.user_type_id = 3;

  UPDATE (SELECT c.master_id AS user_id, SUM(c.master_pl + c.master_commission + c.super_admin_commission_master_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.master_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.balance = (CASE WHEN (pIsRollback = 1) THEN b.balance - a.pl ELSE b.balance + a.pl END)
  WHERE b.user_type_id = 2;

  UPDATE (SELECT c.master_id AS user_id, SUM(c.master_pl + c.master_commission + c.super_admin_commission_master_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.master_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0))
  WHERE b.user_type_id = 2;

  UPDATE (SELECT c.master_id AS user_id, SUM(c.master_pl + c.master_commission + c.super_admin_commission_master_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.master_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.profit_loss = (b.total_balance - b.freechips)
  WHERE b.user_type_id = 2;

  UPDATE (SELECT c.admin_id AS user_id, SUM(c.admin_pl + c.admin_commission + c.super_admin_commission_admin_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.admin_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.balance = (CASE WHEN (pIsRollback = 1) THEN b.balance - a.pl ELSE b.balance + a.pl END)
  WHERE b.user_type_id = 1; 

  UPDATE (SELECT c.admin_id AS user_id, SUM(c.admin_pl + c.admin_commission + c.super_admin_commission_admin_part) AS pl FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.admin_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id)
  SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0))
  WHERE b.user_type_id = 1; 
  
 
  UPDATE user_profit_loss AS a 
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN users c ON (c.id = a.agent_id) 
  LEFT JOIN users d ON (d.id = a.super_agent_id) 
  LEFT JOIN users e ON (e.id = a.master_id) 
  LEFT JOIN users f ON (f.id = a.admin_id) 
  SET 
  a.user_available_balance = ROUND((b.balance - b.liability), 6),
  a.agent_available_balance = ROUND((c.balance - c.liability), 6),
  a.super_agent_available_balance = ROUND((d.balance - d.liability), 6),
  a.master_available_balance = ROUND((e.balance - e.liability), 6),
  a.admin_available_balance = ROUND((f.balance - f.liability), 6)
  
  WHERE a.bet_result_id = pBetResultId;
  
   /*------------------------------Addon for total_balance-----------------------------------*/
  /*
  UPDATE (SELECT c.user_id AS user_id FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.user_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  SET b.total_balance = b.balance - b.liability
  WHERE b.user_type_id = 5;

   UPDATE (SELECT c.agent_id AS user_id,
  (SELECT SUM(total_balance) FROM users WHERE parent_id = c.agent_id AND id = c.user_id) AS total_balance,
  SUM(c.agent_available_balance) AS pl 
  FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  SET  b.total_balance = CASE WHEN (pIsRollback = 1) THEN a.total_balance - a.pl  ELSE a.total_balance + a.pl  END,
  b.profit_loss = CASE WHEN (pIsRollback = 1) THEN (a.total_balance - a.pl) - b.freechips ELSE (a.total_balance + a.pl) - b.freechips END
  WHERE b.user_type_id = 4;

  UPDATE (SELECT c.super_agent_id AS user_id,
  (SELECT SUM(total_balance) FROM users WHERE parent_id = c.super_agent_id AND id = c.agent_id) AS total_balance, 
  SUM(c.super_agent_available_balance) AS pl 
  FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.super_agent_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  SET  b.total_balance = CASE WHEN (pIsRollback = 1) THEN a.total_balance - a.pl ELSE a.total_balance + a.pl END,
  b.profit_loss = CASE WHEN (pIsRollback = 1) THEN (a.total_balance - a.pl) - b.freechips ELSE (a.total_balance + a.pl) - b.freechips END
  WHERE b.user_type_id = 3;

  UPDATE (SELECT c.master_id AS user_id,
  (SELECT SUM(total_balance) FROM users WHERE parent_id = c.master_id AND id = c.super_agent_id) AS total_balance, 
  SUM(c.master_available_balance) AS pl 
  FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.master_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  SET  b.total_balance = CASE WHEN (pIsRollback = 1) THEN a.total_balance - a.pl ELSE a.total_balance + a.pl END,
  b.profit_loss = CASE WHEN (pIsRollback = 1) THEN (a.total_balance - a.pl) - b.freechips ELSE (a.total_balance + a.pl) - b.freechips END
  WHERE b.user_type_id = 2;

  UPDATE (SELECT c.admin_id AS user_id,
  (SELECT SUM(total_balance) FROM users WHERE parent_id = c.admin_id AND id = c.master_id) AS total_balance, 
  SUM(c.admin_available_balance) AS pl 
  FROM user_profit_loss AS c WHERE c.bet_result_id = pBetResultId GROUP BY c.admin_id) a
  INNER JOIN users b ON (b.id = a.user_id) 
  SET   b.total_balance = CASE WHEN (pIsRollback = 1) THEN a.total_balance - a.pl ELSE a.total_balance + a.pl END,
  b.profit_loss = CASE WHEN (pIsRollback = 1) THEN (a.total_balance - a.pl) - b.freechips ELSE (a.total_balance + a.pl) - b.freechips END
  WHERE b.user_type_id = 1; */
  /*------------------------------Addon for total_balance-----------------------------------*/
  
    RETURN TRUE;

END//
DELIMITER ;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
