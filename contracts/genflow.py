# v0.1.0
# { "Depends": "py-genlayer:latest" }
from genlayer import *

import json


class GenFlow(gl.Contract):
    flow_count: u256
    flow_data: str
    has_triggered: bool

    def __init__(self):
        self.flow_count = 0
        self.flow_data = "{}"
        self.has_triggered = False

    @gl.public.write
    def create_flow(
        self,
        title: str,
        condition: str,
        trigger_url: str,
        payee_address: str,
        amount: u256,
        creator_address: str,
    ) -> None:
        """Creates a new GenFlow programmable escrow."""
        creator = creator_address
        flow_id = str(self.flow_count)

        all_flows = json.loads(self.flow_data)
        all_flows[flow_id] = {
            "id": flow_id,
            "title": title,
            "creator": creator,
            "condition": condition,
            "trigger_url": trigger_url,
            "payee_address": payee_address,
            "amount": str(amount),
            "status": "ACTIVE",
            "last_check_result": "Pending...",
            "trigger_reasoning": "",
        }
        self.flow_data = json.dumps(all_flows)
        self.flow_count += 1

    @gl.public.write
    def check_flow(self, flow_id: str) -> None:
        """Triggers the AI read of the Web2 URL to check the condition."""
        all_flows = json.loads(self.flow_data)
        flow = all_flows.get(flow_id)
        if not flow:
            return

        if flow["status"] != "ACTIVE":
            return

        url = flow["trigger_url"]
        condition = flow["condition"]

        def check_condition() -> str:
            try:
                content = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                return json.dumps({
                    "is_met": False,
                    "reasoning": f"Failed to fetch trigger URL: {str(e)}"
                })

            prompt = f"""You are GenFlow, a financial smart contract executor.
You must read the following webpage content and determine if the user's condition is met.

CONDITION TO CHECK:
{condition}

WEBPAGE CONTENT ({url}):
{content[:4000]}

Based ONLY on the webpage content provided above, is the condition currently met?
Respond using ONLY the following format:
{{
    "is_met": bool,
    "reasoning": str
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parseable by a JSON parser without errors.
"""
            try:
                result_text = gl.nondet.exec_prompt(prompt)
                result_text = result_text.replace("```json", "").replace("```", "")
                print(result_text)
                return result_text
            except Exception as e:
                return json.dumps({
                    "is_met": False,
                    "reasoning": f"AI Execution failed: {str(e)}"
                })

        result_json_str = gl.eq_principle.prompt_comparative(
            check_condition,
            "The value of is_met has to match"
        )

        try:
            parsed = json.loads(result_json_str)
            is_met = parsed.get("is_met", False)
            assert isinstance(is_met, bool)
            flow["last_check_result"] = "TRUE" if is_met else "FALSE"
            flow["trigger_reasoning"] = parsed.get("reasoning", "No reasoning provided.")

            if is_met:
                flow["status"] = "TRIGGERED"
                self.has_triggered = True
        except Exception as e:
            flow["last_check_result"] = "ERROR"
            flow["trigger_reasoning"] = f"Failed to parse: {str(e)}"

        all_flows[flow_id] = flow
        self.flow_data = json.dumps(all_flows)

    @gl.public.view
    def get_flow_data(self) -> str:
        return self.flow_data

    @gl.public.view
    def get_flow_count(self) -> u256:
        return self.flow_count

    @gl.public.view
    def get_has_triggered(self) -> bool:
        return self.has_triggered
