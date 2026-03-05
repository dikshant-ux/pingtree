from typing import Dict, Any, Tuple, Optional
from datetime import datetime
from app.models.buyer import Buyer

class FilterEngine:
    @staticmethod
    def evaluate_filter_node(node: Any, lead_data: Dict[str, Any]) -> bool:
        """Recursive evaluator for nested target logic"""
        if node.type == "rule":
            val = lead_data.get(node.field)
            target = node.value
            op = node.operator.upper()
            
            if op == "=":
                return str(val) == str(target)
            if op == "!=":
                return str(val) != str(target)
            if op == "IN":
                allowed = [s.strip().upper() for s in str(target).split(",")]
                return str(val).upper() in allowed
            if op == "NOT IN":
                disallowed = [s.strip().upper() for s in str(target).split(",")]
                return str(val).upper() not in disallowed
            if op == "STARTS_WITH":
                return str(val).upper().startswith(str(target).upper())
            return True
            
        elif node.type == "group":
            if not node.children:
                return True
            
            if node.conjunction.upper() == "OR":
                for child in node.children:
                    if FilterEngine.evaluate_filter_node(child, lead_data):
                        return True
                return False
            else: # AND
                for child in node.children:
                    if not FilterEngine.evaluate_filter_node(child, lead_data):
                        return False
                return True
        return True

    @staticmethod
    def check_filters(buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Returns (Passed, RejectReason)
        """
        # 1. Advanced Recursive Filters (Priority)
        if hasattr(buyer.filters, 'filter_root') and buyer.filters.filter_root:
            if not FilterEngine.evaluate_filter_node(buyer.filters.filter_root, lead_data):
                return False, "Failed advanced targeting nested rules"

        # 2. State Filter (Legacy/Shortcut)
        if buyer.filters.states:
            lead_state = lead_data.get("state", "").upper()
            if lead_state not in [s.upper() for s in buyer.filters.states]:
                return False, f"State {lead_state} not in allowed"
        
        # 3. Zip Filter (Legacy/Shortcut)
        if buyer.filters.zip_codes:
            lead_zip = str(lead_data.get("zip_code", ""))
            if lead_zip not in buyer.filters.zip_codes:
                return False, f"Zip {lead_zip} not in allowed"
        
        # 4. Age Filter
        lead_age = lead_data.get("age")
        if lead_age is None and "dob" in lead_data:
            try:
                dob = datetime.strptime(lead_data["dob"], "%Y-%m-%d")
                today = datetime.today()
                lead_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except:
                pass
        
        if lead_age is not None:
            if buyer.filters.min_age is not None and lead_age < buyer.filters.min_age:
                return False, f"Age {lead_age} < Min {buyer.filters.min_age}"
            if buyer.filters.max_age is not None and lead_age > buyer.filters.max_age:
                return False, f"Age {lead_age} > Max {buyer.filters.max_age}"
                
        # 5. Flat Rules (Legacy support for simple rule-based targeting)
        if buyer.filters.rules and not (hasattr(buyer.filters, 'filter_root') and buyer.filters.filter_root):
            for rule in buyer.filters.rules:
                # Mock a node for evaluation
                from app.models.buyer import FilterNode
                mock_node = FilterNode(type="rule", field=rule.field, operator=rule.operator, value=rule.value)
                if not FilterEngine.evaluate_filter_node(mock_node, lead_data):
                    return False, f"Rule {rule.field} failed"

        # 6. Custom Conditions (Legacy)
        if buyer.filters.custom_conditions:
            for key, value in buyer.filters.custom_conditions.items():
                if lead_data.get(key) != value:
                    return False, f"Custom {key}!={value}"

        return True, None
