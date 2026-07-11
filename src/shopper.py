"""Life Buddy Shopper Agent Microservice.

Handles predictive grocery suggestions based on historical purchase frequency
and organizes list items by store aisles.
"""

import os
import json
import hashlib
from typing import Dict, List, Optional
import time

class ShopperAgent:
    """Agent representing the Principal Shopper, managing grocery items and predictions."""

    def __init__(self, spiffe_id: str = "spiffe://lifebuddy.local/agent/shopper"):
        self.spiffe_id = spiffe_id
        # Hardcoded aisle mapping (to be replaced by vector similarity mapping in DB layer)
        self.aisle_registry = {
            "milk": "Dairy",
            "cheese": "Dairy",
            "yogurt": "Dairy",
            "butter": "Dairy",
            "apples": "Produce",
            "bananas": "Produce",
            "lettuce": "Produce",
            "tomatoes": "Produce",
            "bread": "Bakery",
            "croissant": "Bakery",
            "bagel": "Bakery",
            "cookies": "Bakery"
        }

    def categorize_item(self, item_name: str) -> str:
        """Categorizes a grocery item into its respective supermarket aisle.
        
        Args:
            item_name: The name of the item.
            
        Returns:
            The name of the aisle (e.g. 'Dairy', 'Produce', 'Bakery', or 'Other').
        """
        name_clean = item_name.lower().strip()
        
        # Check direct matches
        if name_clean in self.aisle_registry:
            return self.aisle_registry[name_clean]
            
        # Check partial keyword matches
        for key, value in self.aisle_registry.items():
            if key in name_clean:
                return value
                
        return "Other"

    def predict_needed_items(self, purchase_history: List[Dict]) -> List[Dict]:
        """Analyzes historical purchases and consumption frequencies to predict required items.
        
        Args:
            purchase_history: A list of dicts representing past purchases, e.g.:
                [{"name": "Milk", "timestamp": 1719912000, "interval_days": 7}]
                
        Returns:
            A list of predicted items to add to the shopping list.
        """
        predictions = []
        current_time = time.time()
        one_day = 86400

        for record in purchase_history:
            last_purchased = record.get("timestamp", current_time)
            interval = record.get("interval_days", 7)
            item_name = record.get("name", "")

            # Calculate days elapsed since the item was last purchased
            days_elapsed = (current_time - last_purchased) / one_day

            # If the elapsed time is close to or exceeds the purchase interval, suggest it
            if days_elapsed >= (interval - 1):
                predictions.append({
                    "name": item_name,
                    "aisle": self.categorize_item(item_name),
                    "frequency": f"Every {interval} days"
                })

        return predictions

    def load_tagged_template(self, tag_name: str, existing_templates: Dict[str, List[str]]) -> List[Dict]:
        """Loads a pre-saved list template based on a tag name (e.g., 'Thanksgiving').
        
        Args:
            tag_name: The semantic label of the list (e.g., 'BBQ').
            existing_templates: Dictionary containing pre-saved list structures.
            
        Returns:
            A list of categorized grocery dictionaries.
        """
        # Retrieve the items matching the tag name (case-insensitive)
        tag_clean = tag_name.lower().strip()
        matched_items = []

        for template_tag, items in existing_templates.items():
            if template_tag.lower() == tag_clean:
                matched_items = items
                break

        # Categorize all items matching the template
        return [
            {"name": item, "aisle": self.categorize_item(item)}
            for item in matched_items
        ]

    def get_embedding(self, text_str: str) -> List[float]:
        """Generates a semantic embedding vector for a string."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                response = client.models.embed_content(
                    model="text-embedding-004",
                    contents=text_str
                )
                return response.embeddings[0].values
            except Exception as e:
                print(f"[Embedding] GenAI API call failed: {e}. Falling back to mock embedding.")
        
        # Deterministic 768-dimensional mock vector fallback
        vector = []
        for i in range(768):
            h = hashlib.md5(f"{text_str}-{i}".encode("utf-8")).hexdigest()
            val = int(h, 16) / (2**128 - 1)
            vector.append(val)
        return vector

    def find_template_items(self, query: str, db) -> List[Dict]:
        """Queries the vector store for the closest template and returns its categorized items."""
        query_emb = self.get_embedding(query)
        matches = db.query_similar_vectors(query_emb, limit=1)
        if not matches:
            return []
        
        match = matches[0]
        metadata = match.get("metadata", {})
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except Exception:
                metadata = {}
        
        items = metadata.get("items", [])
        return [
            {"name": item, "aisle": self.categorize_item(item)}
            for item in items
        ]

