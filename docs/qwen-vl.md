通过兼容 OpenAI 格式的 Chat API 调用模型，查看输入输出参数说明及调用示例。

华北2（北京）新加坡美国（弗吉尼亚）德国（法兰克福）
SDK 调用配置的base_url：https://dashscope.aliyuncs.com/compatible-mode/v1

HTTP 请求地址：POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

您需要先获取API Key并配置API Key到环境变量。若通过OpenAI SDK进行调用，需要安装SDK。
请求体
POST
/chat/completions
调试
文本输入流式输出图像输入视频输入工具调用联网搜索异步调用文档理解PPT生成
相关文档：图像与视频理解。
PythonNode.jscurl
 
import OpenAI from "openai";

const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);

async function main() {
    const response = await openai.chat.completions.create({
        model: "qwen-vl-max", // 此处以qwen-vl-max为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [{role: "user",content: [
            { type: "image_url",image_url: {"url": "https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg"}},
            { type: "text", text: "这是什么？" },
        ]}]
    });
    console.log(JSON.stringify(response));
}

main();
model string （必选）

模型名称。

支持的模型：Qwen 大语言模型（商业版、开源版）、Qwen-VL、Qwen-Coder、Qwen-Omni、Qwen-Math、DeepSeek（阿里云直供、硅基流动直供、快手万擎直供）、Kimi（阿里云直供、月之暗面直供）、GLM（阿里云直供）、MiniMax（阿里云直供、稀宇科技直供）。

三方直供模型仅在中国站的中国内地地域可用，调用前需先在百炼控制台开通对应服务（以 SiliconFlow DeepSeek 为例：搜索 deepseek → 找到 SiliconFlow DeepSeek 模型卡片 → 单击立即开通 → 确认授权）。
Qwen-Audio不支持OpenAI兼容协议，仅支持DashScope协议。
具体模型名称和计费，请参见百炼控制台。

messages array （必选）

传递给大模型的上下文，按对话顺序排列。

消息类型

System Message object （可选）

系统消息，用于设定大模型的角色、语气、任务目标或约束条件等。一般放在messages数组的第一位。

QwQ 模型不建议设置 System Message，QVQ 模型设置 System Message不会生效。
属性

User Message object （必选）

用户消息，用于向模型传递问题、指令或上下文等。

属性

Assistant Message object （可选）

模型的回复。通常用于在多轮对话中作为上下文回传给模型。

属性

Tool Message object （可选）

工具的输出信息。

属性

stream boolean （可选） 默认值为 false

是否以流式输出方式回复。相关文档：流式输出

可选值：

false：模型生成全部内容后一次性返回；

true：边生成边输出，每生成一部分内容即返回一个数据块（chunk）。需实时逐个读取这些块以拼接完整回复。

推荐设置为true，可提升阅读体验并降低超时风险。

说明
非流式调用若超过 300 秒未完成，服务将中断请求并返回已生成的内容（而非报错）。建议输出较长的场景务必使用流式调用。详情请参见文本生成模型概述中的超时说明。

stream_options object （可选）

流式输出的配置项，仅在 stream 为 true 时生效。

属性

include_usage boolean （可选）默认值为false

是否在响应的最后一个数据块包含Token消耗信息。

可选值：

true：包含；

false：不包含。

流式输出时，Token 消耗信息仅可出现在响应的最后一个数据块。
modalities array （可选）默认值为["text"]

输出数据的模态，仅适用于 Qwen-Omni 模型。相关文档：非实时（Qwen-Omni）

可选值：

["text","audio"]：输出文本与音频；

["text"]：仅输出文本。

audio object （可选）

输出音频的音色与格式，仅适用于 Qwen-Omni 模型，且modalities参数需为["text","audio"]。相关文档：非实时（Qwen-Omni）

属性

temperature float （可选）

采样温度，控制模型生成文本的多样性。

temperature越高，生成的文本更多样，反之，生成的文本更确定。

取值范围： [0, 2)

temperature与top_p均可以控制生成文本的多样性，建议只设置其中一个值。更多说明，请参见概述。

temperature默认值

不建议修改QVQ模型的默认temperature值 。
top_p float （可选）

核采样的概率阈值，控制模型生成文本的多样性。

top_p越高，生成的文本更多样。反之，生成的文本更确定。

取值范围：（0,1.0]

temperature与top_p均可以控制生成文本的多样性，建议只设置其中一个值。更多说明，请参见概述。

top_p默认值

不建议修改QVQ模型的默认 top_p 值。
top_k integer （可选）

指定生成过程中用于采样的候选 Token 数量。值越大，输出越随机；值越小，输出越确定。若设为 null 或大于 100，则禁用 top_k 策略，仅 top_p 策略生效。取值必须为大于或等于 0 的整数。

top_k默认值

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"top_k":xxx}。
不建议修改QVQ模型的默认 top_k 值。
repetition_penalty float （可选）

模型生成时连续序列中的重复度。提高repetition_penalty时可以降低模型生成的重复度，1.0表示不做惩罚。没有严格的取值范围，只要大于0即可。

repetition_penalty默认值

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"repetition_penalty":xxx}。
使用qwen-vl-plus_2025-01-25模型进行文字提取时，建议设置repetition_penalty为1.0。
不建议修改QVQ模型的默认 repetition_penalty 值。
presence_penalty float （可选）

控制模型生成文本时的内容重复度。

取值范围：[-2.0, 2.0]。正值降低重复度，负值增加重复度。

在创意写作或头脑风暴等需要多样性、趣味性或创造力的场景中，建议调高该值；在技术文档或正式文本等强调一致性与术语准确性的场景中，建议调低该值。

presence_penalty默认值

原理介绍

示例

使用qwen-vl-plus模型进行文字提取时，建议设置presence_penalty为1.5。
不建议修改QVQ模型的默认presence_penalty值。
response_format object （可选） 默认值为{"type": "text"}

返回内容的格式。可选值：

{"type": "text"}：输出文字回复；

{"type": "json_object"}：输出标准格式的JSON字符串。

相关文档：结构化输出。
若指定为{"type": "json_object"}，需在提示词中明确指示模型输出JSON，如：“请按照json格式输出”，否则会报错。
支持的模型参见结构化输出。
属性

max_tokens integer （可选，即将废弃）

该参数即将废弃，新接入请使用 max_completion_tokens。
用于限制模型输出的最大 Token 数。若生成内容超过此值，生成将提前停止，且返回的finish_reason为length。

默认值与最大值均为模型的最大输出长度，请参见百炼控制台。

适用于需控制输出长度的场景，如生成摘要、关键词，或用于降低成本、缩短响应时间。

触发 max_tokens 时，响应的 finish_reason 字段为 length。

max_tokens不限制思考模型思维链的长度。
max_completion_tokens integer （可选）

用于限制模型本次响应中输出的最大 Token 数，包含思维链。若生成内容超过此值，生成将提前停止，且返回的 finish_reason 为 length。

默认值与最大值均为模型的最大输出长度，请参见百炼控制台。

与 max_tokens 的区别：max_completion_tokens 同时限制思考过程与最终响应的总长度，而 max_tokens 不限制思维链长度。思考类模型推荐使用 max_completion_tokens。

支持以下模型：

千问 Max：Qwen3.7-Max 及之后的模型

千问 Plus：Qwen3.5-Plus 及之后的模型

Kimi：kimi-k2.5 及之后的模型

GLM：glm-5 及之后的模型

MiniMax：MiniMax-M2.5 及之后的模型

DeepSeek：deepseek-v4-pro、deepseek-v4-flash 及之后的模型

以上模型均不包含三方直供模型。
实际输出 Token 数与设置的 max_completion_tokens 值之间最多可能存在 10 个 Token 的误差。
vl_high_resolution_images boolean （可选）默认值为false

是否将输入图像的像素上限提升至 16384 Token 对应的像素值。相关文档：处理高分辨率图像。

vl_high_resolution_images：true，使用固定分辨率策略，忽略 max_pixels 设置，超过此分辨率时会将图像总像素缩小至此上限内。

点击查看各模型像素上限

vl_high_resolution_images为false，像素上限由 max_pixels 决定，输入图像的像素超过max_pixels会将图像缩小至max_pixels内。各模型的默认像素上限即max_pixels的默认值。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"vl_high_resolution_images":xxx}。
n integer （可选） 默认值为1

生成响应的数量，取值范围是1-4。适用于需生成多个候选响应的场景，例如创意写作或广告文案。

仅支持 Qwen3（非思考模式）、qwen-plus-character 模型。
若传入 tools 参数， 请将n 设为 1。
增大 n 会增加输出 Token 的消耗，但不增加输入 Token 消耗。
enable_thinking boolean （可选）

使用混合思考（回复前既可思考也可不思考）模型时，是否开启思考模式。适用于 Qwen3.7、Qwen3.6、Qwen3.5、Qwen3、Qwen3-Omni-Flash、Qwen3-VL模型，以及 DeepSeek-V4-Pro/V4-Flash 系列（阿里云直供）、DeepSeek-V3.2/V3.2-exp/V3.1 系列（阿里云直供、硅基流动直供、快手万擎直供）、Kimi-K2.6/K2.5 系列（阿里云直供、月之暗面直供）、GLM 系列。DeepSeek-V4 系列默认开启思考，可通过 reasoning_effort 参数调整推理力度。

可选值：

true：开启

开启后，思考内容将通过reasoning_content字段返回。
false：不开启

不同模型的默认值：支持的模型

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"enable_thinking": xxx}。
稀宇科技直供的MiniMax/MiniMax-M3 不使用此参数，请使用 thinking 参数。
thinking object （可选）默认值为 {"type":"adaptive"}

控制稀宇科技直供的MiniMax/MiniMax-M3 的思考模式。

thinking.type 可选值：

adaptive：自适应（默认），模型自主判断是否需要思考。

disabled：关闭思考，直接回答。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"thinking": {"type": "adaptive"}}。
preserve_thinking boolean （可选）默认值为 false

是否将对话历史中 assistant 消息的 reasoning_content 拼接至模型输入。适用于需要模型参考历史思考过程的场景。

目前支持qwen3.7-max、qwen3.7-max-2026-05-20、qwen3.6-max-preview、qwen3.7-plus、qwen3.7-plus-2026-05-26、qwen3.6-plus、qwen3.6-plus-2026-04-02、kimi-k2.6（阿里云百炼部署）。

若历史消息中不包含 reasoning_content，开启此参数不会报错，正常兼容。

开启后，历史对话中的 reasoning_content 会计入输入 Token 数量并计费。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"preserve_thinking": True}。
thinking_budget integer （可选）

思考过程的最大 Token 数。适用于Qwen3.7、Qwen3.6、Qwen3.5、Qwen3-VL、Qwen3 的商业版与开源版模型。相关文档：限制思考长度。

默认值为模型最大思维链长度，请参见：模型列表

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"thinking_budget": xxx}。
reasoning_effort string （可选）默认值为 high

控制DeepSeek-V4系列模型的推理力度。

可选值：

high：高力度推理

max：最大力度推理

low和medium映射为high，xhigh映射为max。

适用于deepseek-v4-pro、deepseek-v4-flash（阿里云直供）。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"reasoning_effort": "high"}。
tool_stream boolean （可选）默认值为 false

开启后，Function Calling的tool_call arguments以流式增量方式返回，而非一次性返回。仅在stream=true时生效。

适用于glm-5.1、glm-5、glm-4.7、glm-4.6（阿里云直供）。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"tool_stream": true}。
enable_code_interpreter boolean （可选）默认值为 false

是否开启代码解释器功能。相关文档：代码解释器

可选值：

true：开启

false：不开启

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"enable_code_interpreter": xxx}。
seed integer （可选）

随机数种子。用于确保在相同输入和参数下生成结果可复现。若调用时传入相同的 seed 且其他参数不变，模型将尽可能返回相同结果。

取值范围：[0,231−1]。

seed默认值

logprobs boolean （可选）默认值为 false

是否返回输出 Token 的对数概率，可选值：

true

返回

false

不返回

思考阶段生成的内容（reasoning_content）不会返回对数概率。
支持的模型

top_logprobs integer （可选）默认值为0

指定在每一步生成时，返回模型最大概率的候选 Token 个数。

取值范围：[0,5]

仅当 logprobs 为 true 时生效。

stop string 或 array （可选）

用于指定停止词。当模型生成的文本中出现stop 指定的字符串或token_id时，生成将立即终止。

可传入敏感词以控制模型的输出。

stop为数组时，不可将token_id和字符串同时作为元素输入，比如不可以指定为["你好",104307]。
tools array （可选）

包含一个或多个工具对象的数组，供模型在 Function Calling 中调用。相关文档：Function Calling

设置 tools 且模型判断需要调用工具时，响应会通过 tool_calls 返回工具信息。

属性

tool_choice string 或 object （可选）默认值为 auto

工具选择策略。若需对某类问题强制指定工具调用方式（例如始终使用某工具或禁用所有工具），可设置此参数。

可选值：

auto

大模型自主选择工具策略。

none

若不希望进行工具调用，可设定tool_choice参数为none；

{"type": "function", "function": {"name": "the_function_to_call"}}

若希望强制调用某个工具，可设定tool_choice参数为{"type": "function", "function": {"name": "the_function_to_call"}}，其中the_function_to_call是指定的工具函数名称。

思考模式的模型不支持强制调用某个工具。
parallel_tool_calls boolean （可选）默认值为 false

是否开启并行工具调用。相关文档：并行工具调用

可选值：

true：开启

false：不开启

enable_search boolean （可选）默认值为 false

是否开启联网搜索。相关文档：联网搜索

可选值：

true：开启；

若开启后未联网搜索，可优化提示词，或设置search_options中的forced_search参数开启强制搜索。
false：不开启。

启用互联网搜索功能可能会增加 Token 的消耗。
该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"enable_search": True}。
search_options object （可选）

联网搜索的策略。相关文档：联网搜索

属性

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"search_options": xxx}。
X-DashScope-DataInspection string （可选）

在千问 API 的内容安全能力基础上，是否进一步识别输入输出内容的违规信息。取值如下：

'{"input":"cip","output":"cip"}'：进一步识别；

不设置该参数：不进一步识别。

通过 HTTP 调用时请放入请求头：-H "X-DashScope-DataInspection: {\"input\": \"cip\", \"output\": \"cip\"}"；

通过 Python SDK 调用时请通过extra_headers配置：extra_headers={'X-DashScope-DataInspection': '{"input":"cip","output":"cip"}'}。

详细使用方法请参见输⼊输出 AI 安全护栏。

不支持通过 Node.js SDK设置。
skill array （可选）

技能参数，用于启用特定生成技能（如PPT生成）。仅qwen-doc-turbo模型支持。详细用法请参见生成PPT。

该参数非OpenAI标准参数。通过 Python SDK调用时，请放入 extra_body 对象中。配置方式为：extra_body={"skill": [...]}。
使用 skill 时，stream 必须设置为 true。
属性

chat响应对象（非流式输出）
 
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "我是阿里云开发的一款超大规模语言模型，我叫千问。"
            },
            "finish_reason": "stop",
            "index": 0,
            "logprobs": null
        }
    ],
    "object": "chat.completion",
    "usage": {
        "prompt_tokens": 3019,
        "completion_tokens": 104,
        "total_tokens": 3123,
        "prompt_tokens_details": {
            "cached_tokens": 2048
        }
    },
    "created": 1735120033,
    "system_fingerprint": null,
    "model": "qwen-plus",
    "id": "chatcmpl-6ada9ed2-7f33-9de2-8bb0-78bd4035025a"
}
id string

本次调用的唯一标识符。

choices array

模型生成内容的数组。

属性

created integer

请求创建时的 Unix 时间戳（秒）。

model string

本次请求使用的模型。

object string

始终为chat.completion。

service_tier string

该参数当前固定为null。

system_fingerprint string

该参数当前固定为null。

usage object

本次请求的 Token 消耗信息。

属性

chat响应chunk对象（流式输出）
 
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"","function_call":null,"refusal":null,"role":"assistant","tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"我是","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"来自","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"阿里","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"云的超大规模","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"语言模型，我","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"叫千问千","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"问。","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[{"delta":{"content":"","function_call":null,"refusal":null,"role":null,"tool_calls":null},"finish_reason":"stop","index":0,"logprobs":null}],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":null}
{"id":"chatcmpl-e30f5ae7-3063-93c4-90fe-beb5f900bd57","choices":[],"created":1735113344,"model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,"system_fingerprint":null,"usage":{"completion_tokens":17,"prompt_tokens":22,"total_tokens":39,"completion_tokens_details":null,"prompt_tokens_details":{"audio_tokens":null,"cached_tokens":0}}}
id string

本次调用的唯一标识符。每个chunk对象有相同的 id。

choices array

模型生成内容的数组，可包含一个或多个对象。若设置include_usage参数为true，则choices在最后一个chunk中为空数组。

属性

created integer

本次请求被创建时的时间戳。每个chunk有相同的时间戳。

model string

本次请求使用的模型。

object string

始终为chat.completion.chunk。

service_tier string

该参数当前固定为null。

system_fingerprintstring

该参数当前固定为null。

usage object

本次请求消耗的Token。只在include_usage为true时，在最后一个chunk显示。

