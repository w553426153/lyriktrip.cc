postman request POST 'https://integrate.api.nvidia.com/v1/chat/completions' \
  --header 'Authorization: Bearer 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' \
  --header 'Content-Type: application/json' \
  --body '{
    "model": "nvidia/nemotron-3-super-120b-a12b",
    "messages": [
        {
            "role": "system",
You are a professional AI assistant.
        },
        {
            "role": "user",
Please introduce the development history of artificial intelligence.
        }
    ],
    "temperature": 0.7,
    "max_tokens": 8000,
    "chat_template_kwargs": {
        "enable_thinking": false
    }
}'


Response structure:
{
    "id": "chatcmpl-976c6c4cf378b9f4",
    "object": "chat.completion",
    "created": 1773288110,
    "model": "nvidia/nemotron-3-super-120b-a12b",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
"content": "The development of artificial intelligence (Artificial Intelligence, AI) is a legendary journey filled with breakthroughs, setbacks, and revivals, which can be broadly divided into the following stages:\n\n---\n\n### **I. The Emergence Phase (1940s–1950s): Theoretical Foundation and Conceptual Birth**\n\n- **1943**: Warren McCulloch and Walter Pitts proposed the first neural network model (McCulloch-Pitts neuron), laying the theoretical foundation for neural networks and machine learning.\n- **1950**: Alan Turing published the paper *Computing Machinery and Intelligence*, introducing the famous **Turing Test**, which first transformed the philosophical question of \"Can machines think?\" into an operational experimental standard.\n- **1956**: The Dartmouth Workshop is regarded as the **birthmark of artificial intelligence**. John McCarthy first coined the term \"artificial intelligence\", and together with Marvin Minsky, Nathaniel Rochester, Claude Shannon, and other scientists, laid the foundation for AI as a discipline.\n\n> The goals of this era were ambitious: it was believed that \"given enough time and resources, machines could learn, reason, and solve problems just like humans.\"\n\n---\n\n### **II. Early Enthusiasm and the First AI Winter (1950s–1970s): Symbolism’s Rise and the Exposure of Limitations**\n\n- **1950s–1960s**: Early AI systems made astonishing progress:\n  - 1952: Arthur Samuel wrote a checkers program capable of self-learning.\n  - 1956: The Logic Theorist—developed by Newell",
                "refusal": null,
                "annotations": null,
                "audio": null,
                "function_call": null,
                "tool_calls": [],
                "reasoning": null,
                "reasoning_content": null
            },
            "logprobs": null,
            "finish_reason": "length",
            "stop_reason": null,
            "token_ids": null
        }
    ],
    "service_tier": null,
    "system_fingerprint": null,
    "usage": {
        "prompt_tokens": 38,
        "total_tokens": 538,
        "completion_tokens": 500,
        "prompt_tokens_details": null
    },
    "prompt_logprobs": null,
    "prompt_token_ids": null,
    "kv_transfer_params": null
}