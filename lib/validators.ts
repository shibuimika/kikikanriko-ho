import Ajv, { JSONSchemaType } from 'ajv';
import { QuestionsSchema, FollowUpSchema, QuestionsResponse, FollowUpResponse } from './schemas';
import { logger } from './logging';

const ajv = new Ajv();

// Create validators
const validateQuestions = ajv.compile(QuestionsSchema);
const validateFollowUp = ajv.compile(FollowUpSchema);

export async function validateOrRetry<T>(
  schema: any,
  text: string,
  retryFn: () => Promise<string>,
  maxRetries: number = 2
): Promise<T> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      logger.info(`Attempting to parse response on attempt ${attempt + 1}`, { 
        response_preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
      
      const parsed = JSON.parse(text);
      
      // Determine which validator to use
      let isValid = false;
      if (schema === QuestionsSchema) {
        isValid = validateQuestions(parsed);
      } else if (schema === FollowUpSchema) {
        isValid = validateFollowUp(parsed);
      }
      
      if (isValid) {
        logger.info(`Validation successful on attempt ${attempt + 1}`);
        return parsed as T;
      } else {
        const errors = schema === QuestionsSchema ? 
          validateQuestions.errors : 
          validateFollowUp.errors;
        
        logger.warn(`Validation failed on attempt ${attempt + 1}`, { errors });
        
        if (attempt >= maxRetries) {
          throw new Error(`Validation failed after ${maxRetries + 1} attempts: ${JSON.stringify(errors)}`);
        }
      }
    } catch (parseError) {
      logger.warn(`JSON parse failed on attempt ${attempt + 1}`, { 
        error: parseError,
        response_preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
      
      if (attempt >= maxRetries) {
        throw new Error(`JSON parsing failed after ${maxRetries + 1} attempts: ${parseError}`);
      }
    }
    
    // Retry if we haven't exceeded max attempts
    if (attempt < maxRetries) {
      logger.info(`Retrying... attempt ${attempt + 2}`);
      text = await retryFn();
      attempt++;
    } else {
      break;
    }
  }
  
  throw new Error(`Failed to validate after ${maxRetries + 1} attempts`);
}

export { validateQuestions, validateFollowUp };