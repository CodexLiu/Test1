import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';


const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. Assess the intent of the follow up question. If it does not appear to be relevant to the chat history, generate a standalone question that best reflects the user's intent with their query. 

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
   Make sure to give a comprehensive answer tha covers all aspects of the question.
If you can't find the answer in the context below, just say "Hmm, I'm not sure." Don't try to make up an answer.
At the end of every sentence, reference the context that you got it from by the filename; do not include the path. Place these sources at the end of every sentence, not at the end of your response.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void
) => {
  console.log('Creating questionGenerator chain');
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });

  console.log('Creating docChain');
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              console.log('New token:', token);
              onTokenStream(token);
            },
          })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  console.log('Creating ChatVectorDBQAChain');
  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 10,
  });
};