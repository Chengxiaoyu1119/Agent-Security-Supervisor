import unittest

from backend.zhian.supervisor import decide


class SupervisorDecisionTest(unittest.TestCase):
    def test_sensitive_api_call_is_rejected(self):
        decision = decide(
            {
                "tool": "api.call",
                "arguments": {"endpoint": "/api/admin/scoreboard"},
                "risk_hint": "sensitive_api",
            },
            guard_enabled=True,
        )

        self.assertEqual(decision.policy_id, "sensitive-api")
        self.assertEqual(decision.risk_level, "critical")
        self.assertGreaterEqual(decision.risk_score, 90)
        self.assertTrue(decision.risk_factors)

    def test_dangerous_command_is_rejected(self):
        decision = decide(
            {
                "tool": "code.run",
                "arguments": {"command": "rm -rf /tmp/demo"},
                "risk_hint": "dangerous_command",
            },
            guard_enabled=True,
        )

        self.assertEqual(decision.policy_id, "dangerous-command")
        self.assertEqual(decision.risk_level, "critical")
        self.assertGreaterEqual(decision.risk_score, 90)

    def test_guard_disabled_keeps_auditable_risk_trace(self):
        decision = decide(
            {
                "tool": "file.read",
                "arguments": {"path": "public/readme.md"},
            },
            guard_enabled=False,
        )

        self.assertEqual(decision.policy_id, "guard-disabled")
        self.assertEqual(decision.risk_level, "low")
        self.assertGreater(decision.risk_score, 0)
        self.assertTrue(decision.risk_factors)


if __name__ == "__main__":
    unittest.main()
